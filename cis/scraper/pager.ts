import type { Encoding } from "bun";
import iconv from "iconv-lite";

export interface PagerOptions {
  baseUrl: string;
  pageParam?: string;
  startPage?: number;
  endPage?: number;
  maxPages?: number;
  shouldStop?: (response: Response, body: string) => boolean | Promise<boolean>;
  fetchOptions?: RequestInit;
  encodings?: string[];
}

export interface PageResult {
  page: number;
  response: Response;
  body: string;
  url: string;
}

function getCharsetFromContentType(contentType: string | null): string | null {
  if (!contentType) return null;
  const match = contentType.match(/charset=([^;]+)/i);
  return match ? match[1]!.trim() : null;
}

async function decodeResponseBody(
  response: Response,
  preferredEncodings: string[] = [],
): Promise<string> {
  const contentType = response.headers.get("content-type");
  const charsetFromHeader = getCharsetFromContentType(contentType);

  const buffer = await response.arrayBuffer();

  const encodings = [...preferredEncodings, charsetFromHeader].filter(
    Boolean,
  ) as string[];

  for (const encoding of encodings) {
    try {
      return new TextDecoder(encoding as Encoding).decode(buffer);
    } catch (e) {
      try {
        return iconv.decode(Buffer.from(buffer), encoding);
      } catch (iconvError) {
        console.warn(`Failed to decode using ${encoding}: ${iconvError}`);
      }
    }
  }

  return new TextDecoder().decode(buffer);
}

export async function* fetchPages(
  options: PagerOptions,
): AsyncGenerator<PageResult, void, unknown> {
  const {
    baseUrl,
    pageParam = "p",
    startPage = 0,
    endPage = Number.MAX_SAFE_INTEGER,
    maxPages,
    shouldStop,
    fetchOptions = {},
    encodings = [],
  } = options;

  let currentPage = startPage;
  let pagesProcessed = 0;
  const maxPagesToProcess = maxPages ?? endPage - startPage + 1;

  while (pagesProcessed < maxPagesToProcess && currentPage <= endPage) {
    const url = new URL(baseUrl);
    url.searchParams.set(pageParam, currentPage.toString());

    const finalUrl = url.toString();
    console.log(`Fetching page ${currentPage}: ${finalUrl}`);

    const response = await fetch(finalUrl, fetchOptions);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch page ${currentPage}: HTTP ${response.status}`,
      );
    }

    const body = await decodeResponseBody(response, encodings);

    if (shouldStop && (await shouldStop(response, body))) {
      console.log(`Stopping at page ${currentPage} due to condition.`);
      break;
    }

    yield {
      page: currentPage,
      response,
      body,
      url: finalUrl,
    };

    currentPage++;
    pagesProcessed++;
  }
}

export interface NestedPageResult extends PageResult {
  outerPage: number;
  innerPage: number;
}

export interface OuterPageContext<T> {
  outerPage: number;
  context: T;
}

export async function processNestedPages<T>({
  baseUrl,
  outerParam,
  outerStartPage = 0,
  outerEndPage = Number.MAX_SAFE_INTEGER,
  innerParam,
  innerStartPage = 0,
  innerEndPage = Number.MAX_SAFE_INTEGER,
  shouldStopOuter,
  shouldStopInner,
  fetchOptions,
  encodings,
  processOuterPage,
  processInnerPage,
}: {
  baseUrl: string;
  outerParam: string;
  outerStartPage?: number;
  outerEndPage?: number;
  innerParam: string;
  innerStartPage?: number;
  innerEndPage?: number;
  shouldStopOuter?: (
    response: Response,
    body: string,
  ) => boolean | Promise<boolean>;
  shouldStopInner?: (
    response: Response,
    body: string,
  ) => boolean | Promise<boolean>;
  fetchOptions?: RequestInit;
  encodings?: string[];
  processOuterPage: (firstInnerPage: NestedPageResult) => Promise<T>;
  processInnerPage: (page: NestedPageResult, outerContext: T) => Promise<void>;
}): Promise<void> {
  for (let outerPage = outerStartPage; outerPage <= outerEndPage; outerPage++) {
    const outerUrl = new URL(baseUrl);
    outerUrl.searchParams.set(outerParam, outerPage.toString());
    console.log(`Processing outer page ${outerPage}`);

    let isFirstInnerPage = true;
    let outerContext: T | null = null;

    let j = 0;
    let stopOuter = false;

    for await (const result of fetchPages({
      baseUrl: outerUrl.toString(),
      pageParam: innerParam,
      startPage: innerStartPage,
      endPage: innerEndPage,
      shouldStop: shouldStopInner,
      fetchOptions,
      encodings,
    })) {
      if (
        j == 0 &&
        shouldStopOuter &&
        (await shouldStopOuter(result.response, result.body))
      ) {
        stopOuter = true;
        break;
      }

      const nestedResult = {
        ...result,
        outerPage,
        innerPage: result.page,
      };

      if (isFirstInnerPage) {
        outerContext = await processOuterPage(nestedResult);
        isFirstInnerPage = false;
      }

      await processInnerPage(nestedResult, outerContext!);

      j++;
    }

    if (stopOuter) {
      console.log(
        `Stopping outer page processing at page ${outerPage} due to condition.`,
      );
      break;
    }
  }
}
