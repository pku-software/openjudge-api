import { get } from "./http.js";

export interface ContestInfo {
  title: string;
  href: string;
  id: number;
  problemCount: number;
  beginDate: Date | null;
  endDate: Date | null;
}

export async function getContests(): Promise<ContestInfo[]> {
  let pages = 1;
  const result: ContestInfo[] = [];
  for (let i = 1; i <= pages; i++) {
    const $ = await get(`/admin/contests?page=${i}`);
    let lastPageEle = $("a[href^=?page=]:not(.nextprev)").eq(-1);
    if (lastPageEle.length) {
      pages = Number(lastPageEle.attr("href")?.split("?page=")[1]);
    }
    result.push(
      ...$("tbody tr")
        .map((i, elem) => {
          const titleElement = $(elem).find(".contest-title a");
          const title = titleElement.text();
          const href = titleElement.attr("href") ?? "";
          const editElement = $(elem).find(".operation.opera a");
          const id = Number(editElement.attr("href")?.split("?id=")[1]);
          const problemCount = Number($(elem).find(".operation").eq(1).text());
          const beginDate = $(elem).find(".date").eq(0).text();
          const endDate = $(elem).find(".date").eq(1).text();
          return {
            title,
            href,
            id,
            problemCount,
            beginDate: beginDate ? new Date(beginDate) : null,
            endDate: endDate ? new Date(endDate) : null,
          };
        })
        .toArray()
    );
  }
  return result;
}

export async function getProblemsOfContest(id: number) {
  const $ = await get(`/admin/contests/edit-problems/?id=${id}`);
  return $("form").map((i, elem) => {
    const number = $(elem).find("input[name=problemNumber]").val();
    const problemId = $(elem).find("input[name=problemId]").val();
    return {
      id: Number(problemId),
      number: `${number}`,
    }
  }).toArray();
}

export interface ProblemInfo {
  title: string;
  description: string;
  input: string;
  output: string;
  sampleInput: string;
  sampleOutput: string;
  hint: string;
  prefix: string;
  suffix: string;
}

export async function getProblemInfo(contestHref: string, problemNo: string): Promise<ProblemInfo>;
export async function getProblemInfo(id: number): Promise<ProblemInfo>;
export async function getProblemInfo(a: string | number, b?: string) : Promise<ProblemInfo> {
  if (typeof a === "number") {
    // Admin, by id
    const $ = await get(`/admin/problems/edit/?id=${a}`);
    const title = $("input[name=title]").val();
    const description = $("textarea[name=description]").val();
    const input = $("textarea[name=input]").val();
    const output = $("textarea[name=output]").val();
    const sampleInput = $("textarea[name=sampleInput]").val();
    const sampleOutput = $("textarea[name=sampleOutput]").val();
    const hint = $("textarea[name=hint]").val();

    const $2 = await get(`/admin/problems/predefined/?id=${a}`);
    const prefix = $2("textarea[name=prefix]").val();
    const suffix = $2("textarea[name=suffix]").val();

    return {
      title: `${title}`,
      description: `${description}`,
      input: `${input}`,
      output: `${output}`,
      sampleInput: `${sampleInput}`,
      sampleOutput: `${sampleOutput}`,
      hint: `${hint}`,
      prefix: `${prefix}`,
      suffix: `${suffix}`,
    }
  } else {
    // Guest, from contest page
    const url = `${a}${b}`;
    const $ = await get(url);
    const title = $("#pageTitle").text().split(":")[1];
    const contents: string[] = []
    $(".problem-content").children().each((i, elem) => {
      if (!$(elem).is("dd")) return;
      if ($(elem).children().length === 1 && $(elem).children().is("pre")) {
        contents.push($(elem).children().text());
      } else {
        const html = $(elem).html();
        html && contents.push(html);
      }
    })
    const hasPredefined = $(".sh_cpp").length > 0;
    const predefinedOffset = hasPredefined ? 2 : 0;
    return {
      title,
      description: contents[0],
      prefix: hasPredefined ? contents[1] : "",
      suffix: hasPredefined ? contents[2] : "",
      input: contents[1 + predefinedOffset],
      output: contents[2 + predefinedOffset],
      sampleInput: contents[3 + predefinedOffset],
      sampleOutput: contents[4 + predefinedOffset],
      hint: contents[5 + predefinedOffset] ?? ""
    };
  }
}
