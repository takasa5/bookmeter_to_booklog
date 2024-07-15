import * as CSV from "https://deno.land/std@0.170.0/encoding/csv.ts";
import encoding from 'https://cdn.skypack.dev/encoding-japanese';

const BOOKMETER_URL = "https://bookmeter.com";
const BOOKMETER_MAX_LIMIT = 100;
const USER_ID = 26460;

let dataList: Array<Array<String>> = [];
for (let offset = 0; offset < Number.MAX_VALUE; offset = offset + BOOKMETER_MAX_LIMIT) {
    const listRes = await fetch(BOOKMETER_URL + `/users/${USER_ID}/reviews.json?offset=${offset}&limit=${BOOKMETER_MAX_LIMIT}`);
    const listJson = await listRes.json();

    if (listJson.resources.length === 0) {
        // レビューが1件も無くなったら終了
        break;
    }

    listJson.resources.forEach(resource => {
        let row: Array<String> = [];
        // サービスID
        row.push(toQuotedString("1"));
        // ASIN
        const amazonUrl = new URL(resource.contents.book.amazon_urls.registration);
        const paths = amazonUrl.pathname.split("/");
        row.push(paths[paths.length - 1]);
        // ISBN
        row.push(toQuotedString(""));
        // カテゴリ
        row.push(toQuotedString(""));
        // 評価
        row.push(toQuotedString(""));
        // 読書状況
        row.push(toQuotedString("読み終わった"));
        // レビュー
        row.push(toQuotedString(resource.content));
        // タグ
        row.push(toQuotedString(""));
        // 読書メモ
        row.push(toQuotedString(""));
        // 登録日時
        const now = new Date().toLocaleString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
        row.push(toQuotedString(now));
        // 読了日
        const readDate = new Date(resource.created_at).toLocaleString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
        row.push(toQuotedString(readDate));
    
        dataList.push(row);
    });
}

const csvText = CSV.stringify(dataList.reverse());
const utf8Encoder = new TextEncoder();
const utf8Bytes = utf8Encoder.encode(csvText.replaceAll('"""', '"'));
const sjisBytesArray = encoding.convert(utf8Bytes, {from:"UTF8", to:"SJIS"});
const sjisBytes = Uint8Array.from(sjisBytesArray);
await Deno.writeFile(new URL("./books.csv", import.meta.url), sjisBytes);

function toQuotedString(str: string): string {
    return '"' + str + '"';
}