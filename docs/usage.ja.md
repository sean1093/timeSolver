# 使い方ガイド

timeSolver 2.x をタスク別に案内します。網羅的なシグネチャは
[API リファレンス](api.md)、1.x からの移行は
[移行ガイド](migration-v1-v2.md)を参照してください。
ドキュメント全体の索引は[ドキュメント一覧](README.md)にあります。

[English](usage.md) と [繁體中文](usage.zh.md) でもお読みいただけます。

API リファレンス、レシピ集、サポートポリシーは現時点では英語のみです。

## インストールとインポート

```sh
npm install timesolver
```

```ts
// 使うものだけをインポートすれば、残りはツリーシェイキングで削除されます。
// 以降の例では、呼び出す関数に対応するインポートを前提とします。
import {
  add,
  after,
  before,
  between,
  clamp,
  endOf,
  equal,
  getString,
  isBetween,
  isValid,
  max,
  min,
  parse,
  startOf,
  subtract,
} from 'timesolver';
```

```js
// CommonJS
const { add, getString } = require('timesolver');
```

```html
<!-- ブラウザ、バンドラーなし -->
<script src="https://unpkg.com/timesolver/dist/timesolver.global.js"></script>
<script>
  timeSolver.getString(new Date(), 'YYYY-MM-DD');
</script>
```

すべての関数は `Date`、エポックミリ秒、または言語の `Date` が解析できる文字列を
受け取り、ホストのタイムゾーンで動作します。

## 日付をフォーマットする

```ts
const stamp = new Date(2024, 2, 17, 14, 30, 45, 123); // 2024年3月17日（日）

getString(stamp);                            // '20240317'  （デフォルトフォーマット）
getString(stamp, 'YYYY-MM-DD');              // '2024-03-17'
getString(stamp, 'YYYY-MM-DD HH:mm:ss.SSS'); // '2024-03-17 14:30:45.123'
getString(stamp, 'ddd, D MMM YYYY');         // 'Sun, 17 Mar 2024'
getString(stamp, 'h:mm a');                  // '2:30 pm'
getString(stamp, '[Quarter] Q [of] YYYY');   // 'Quarter 1 of 2024'
```

大文字のトークンは大きい単位、小文字は小さい単位を表します。`MM` は月、
`mm` は分、`DD` は日、`dddd` は曜日名です。リテラルの語句は角括弧で囲み、
その文字がトークンとして読まれないようにしてください。

トークンの一覧表は [API リファレンス](api.md#tokens)にあります。
次の 2 種類のフォーマットは、いずれも `INVALID_FORMAT` として拒否されます。

```ts
getString(stamp, 'YYYYMD'); // 例外：'M' が 'D' に続くため '2024112' は判別できない
getString(stamp, 'nope');   // 例外：トークンが 1 つもない。'[nope]' を使う
```

1 文字のトークンもあることに注意してください。`s` が秒のトークンなので、
`'oops'` は `'oop45'` になります。トークンとして扱いたくないリテラルは、
必ずエスケープしてください。

1.x が受け付けていたフォーマット名はすべて有効なので、
`getString(stamp, 'YYYY-MM-DD HH:MM:SS')` は引き続き
`'2024-03-17 14:30:45'` を返します。これらの名前は大文字小文字を問いませんが、
書いた文字列自体が正しいトークン列になっている場合は例外です。`'hh:mm:ss'` は
12 時間制の時・分・秒なので、1.x で同じ綴りが意味した 24 時間制ではなく
`'02:30:45'` を返します。

## 文字列から日付を読み取る

`parse` は厳格です。入力はフォーマットと完全に一致していなければならず、
得られた日付をフォーマットし直すと同じ文字列に戻る必要があります。

```ts
parse('17/03/2024', 'DD/MM/YYYY');                  // 2024-03-17 00:00 ローカル時刻
parse('2024-03-17 14:30', 'YYYY-MM-DD HH:mm');      // 時刻付き
parse('03/17/2024 02:30 PM', 'MM/DD/YYYY hh:mm A'); // 12 時間制

parse('31/02/2024', 'DD/MM/YYYY'); // 例外：2 月に 31 日は存在しない
parse('2024-3-7', 'YYYY-MM-DD');   // 例外：ゼロ埋めが一致しない
```

フォーマットに現れない要素は 1970-01-01 が既定値になります。そのため
`parse('12:30:00', 'HH:mm:ss')` はエポック当日の時刻となり、
一日のうちの時刻どうしを比較するのに便利です。

## 入力を検証する

```ts
isValid('2020-01-01');               // true  — Date が読めるものはすべて
isValid('nope');                     // false
isValid('2020-02-29', 'YYYY-MM-DD'); // true  — 2020 年はうるう年
isValid('2021-02-29', 'YYYY-MM-DD'); // false
isValid('31-02-2020', 'DD-MM-YYYY'); // false — 存在しない日付
isValid('12:30:00', 'HH:mm:ss');     // true
```

`isValid` は不正なデータでも例外を投げません。そのため、
例外を投げる関数を呼ぶ前のガードとして最適です。

```ts
function shiftDeadline(input: unknown, days: number): Date | undefined {
  if (typeof input !== 'string' || !isValid(input, 'YYYY-MM-DD')) {
    return undefined;
  }
  return add(parse(input, 'YYYY-MM-DD'), days, 'day');
}
```

## 加算と減算

入力が書き換えられることはありません。呼び出しごとに新しい `Date` を返します。

```ts
add(stamp, 90, 'minute');    // 実際の経過時間
add(stamp, 1, 'day');        // 夏時間の有無にかかわらず、翌日の同じ時刻
add(stamp, 1, 'week');
add(stamp, 1, 'month');      // 月末に丸められる：1月31日 + 1か月 = 2月29日
add(stamp, -1, 'year');
subtract(stamp, 2, 'hour');
```

単位名は大文字小文字を区別せず、1.x の略称も受け付けます。`'D'`、`'H'`、
`'MIN'`、月を表す `'M'`、年を表す `'Y'` です。

小数が使えるのはミリ秒から時間までです。日以上の単位は長さが一定でないため、
小数は拒否されます。

```ts
add(stamp, 1.5, 'hour');  // 問題なし
add(stamp, 1.5, 'month'); // INVALID_ARGUMENT を投げる
```

## カレンダー範囲

```ts
startOf(stamp, 'day');     // 2024-03-17 00:00:00.000
endOf(stamp, 'day');       // 2024-03-17 23:59:59.999
startOf(stamp, 'week');    // 2024-03-17 00:00（週は日曜始まり）
startOf(stamp, 'week', { weekStartsOn: 1 }); // 2024-03-11 00:00（ISO-8601）
startOf(stamp, 'month');   // 2024-03-01 00:00
endOf(stamp, 'month');     // 2024-03-31 23:59:59.999
startOf(stamp, 'quarter'); // 2024-01-01 00:00
```

たとえば月初から現在までを絞り込むには次のようにします。

```ts
const monthStart = startOf(new Date(), 'month');
const monthEnd = endOf(new Date(), 'month');
const rows = all.filter((row) => isBetween(row.createdAt, monthStart, monthEnd));
```

隣接する範囲を続けて並べるときは半開区間を指定すれば、重複も隙間も生じません。

```ts
isBetween(date, monthStart, add(monthStart, 1, 'month'), { bounds: '[)' });
```

## 比較と差分の計測

```ts
between('2020-01-01T00:00', '2020-01-02T00:00', 'hour');  // 24
between('2020-01-01T00:00', '2020-02-01T00:00', 'month'); // 1
between('2020-01-01T00:00', '2020-01-16T00:00', 'month'); // 0.4838…
```

基準は単位ごとに選ばれており、その単位が意味する答えが返るようになっています。

- ミリ秒から時間までは**実際の経過時間**を測るため、夏時間へ切り替わる 23 時間の日は `23` 時間になります。
- 日と週は**ローカルカレンダー**を測るため、その日は `1` となり、日をまたぐ正午から正午も `1` です。
- 月・四半期・年は**カレンダー**を測り、端数はそれが含まれる月の長さに応じて按分されます。

`between(a, b, unit)` は常に `between(b, a, unit)` の符号を反転した値になります。

比較関数は任意で単位を受け取り、比較の粒度を指定できます。

```ts
equal('2024-03-17T01:00', '2024-03-17T23:00', 'day'); // true、同じ日
after('2024-03-17T23:00', '2024-03-17T01:00');        // true、より後の時点
after('2024-03-17T23:00', '2024-03-17T01:00', 'day'); // false、同じ日
afterToday(add(new Date(), 1, 'day'));                // true
beforeToday(new Date());                              // false
```

## 範囲

```ts
isBetween('2024-03-15T12:00', '2024-03-01T00:00', '2024-04-01T00:00');       // true
isBetween('2024-04-01T00:00', '2024-03-01T00:00', '2024-04-01T00:00', { bounds: '[)' }); // false
min('2024-03-17T00:00', '2024-01-01T00:00');                                 // 2024-01-01
max('2024-03-17T00:00', '2024-01-01T00:00');                                 // 2024-03-17
clamp('2024-06-01T00:00', '2024-01-01T00:00', '2024-03-01T00:00');           // 2024-03-01
```

`isBetween` の境界は区間記法で指定します。`'[]'`、`'[)'`、`'(]'`、`'()'` の
4 種類です。範囲が前後で連続するときは `'[)'` を選べば、重複も隙間も生じません。
上の比較関数と同じく、単位と `weekStartsOn` も受け取ります。`clamp` は下限が
上限より後の場合に例外を投げます。

## カレンダーユーティリティ

```ts
getFullWeek(stamp);              // 'Sunday'
getAbbrWeek(stamp);              // 'Sun'
getFullMonth(stamp);             // 'March'
getAbbrMonth(stamp);             // 'Mar'
getQuarter(stamp);               // 1
getQuarterByMonth(5);            // 2
getFirstMonthByQuarter(3);       // 7
isLeapYear(2024);                // true
daysInMonth(2024, 2);            // 29
```

週番号には 2 種類あります。年の変わり目で 2 つの慣習の答えが食い違うためです。

```ts
getISOWeek('2024-12-30T12:00');     // 1  -- ISO-8601：第 1 週は月曜始まり
getISOWeekYear('2024-12-30T12:00'); // 2025。2024 ではない

getWeekOfYear('2024-12-30T12:00');  // 53 -- 暦年。第 1 週は 1 月 1 日を含む
```

ISO の年と週は必ず対で出力し、`YYYY` を ISO 週番号と組み合わせないでください。

```ts
`${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`; // '2025-W01'
```

名称は英語で、固定のテーブルから返されるため、エンジンやロケールによって
変わることはありません。ローカライズした出力が必要な場合は、必要な部分を
`Intl.DateTimeFormat` でフォーマットしてください。

## エラーを扱う

不正な入力は `TimeSolverError` を投げます。
このエラーは分岐に使える `code` を持っています。

```ts
import { TimeSolverError, getString } from 'timesolver';

try {
  getString(userInput, userFormat);
} catch (error) {
  if (error instanceof TimeSolverError) {
    switch (error.code) {
      case 'INVALID_DATE':
        return 'That is not a date I can read.';
      case 'INVALID_FORMAT':
        return 'That format string is not valid.';
      default:
        throw error;
    }
  }
  throw error;
}
```

コンソールには何も出力されません。また、失敗を表す番兵値として
`null` を返す関数もありません。

## 遅い処理をプロファイリングする

```ts
import { createProfiler } from 'timesolver/profiler';

const profiler = createProfiler();

profiler.start();
const rows = await loadRows();
profiler.mark('load');
const view = render(rows);
profiler.mark('render');

profiler.print();
// [timeSolver] 2 mark(s) in 128.412 ms
//   1. load    96.210 ms  74.9%  <- slowest
//   2. render  32.202 ms  25.1%
```

プロファイラーはそれぞれ独立したタイムラインを持つため、入れ子の計測が
互いに干渉することはありません。また `report()` が
`{ total, slowest, marks }` を返すので、コンソール出力に頼らず
アサーションやメトリクスに利用できます。1.x の `timeLookStart`、`timeLook`、
`timeLookReport` という名前は引き続きエクスポートされているため、1.x のコードも
1.x の `<script>` タグもそのまま動作します。

## 知っておきたいこと

**文字列の解析は言語の仕様に従います。** `new Date('2024-03-10')` は UTC の
深夜 0 時、`new Date('2024-03-10T00:00')` はローカル時刻です。
このライブラリは文字列をそのまま `Date` に渡すため、同じ規則が適用されます。
結果に影響する場面では、`Date` を渡すか、時刻も含めるか、
明示的なフォーマットを指定して `parse` を使ってください。

**タイムゾーンは扱いません。** すべてホストのローカル時刻です。`Z` と `ZZ` は
現在のオフセットを出力でき、`parse` で読み戻すこともできます。オフセットは
タイムゾーンではなく加減算なので、得られる時刻は正確です。ただしタイムゾーン名は
解釈しません。タイムゾーンを意識した処理には `Temporal` や
`Intl.DateTimeFormat` を使ってください。

**繰り返される 1 時間は曖昧です。** 時計が巻き戻るときには、同じ時刻表記が
2 つの時点を指すことになり、`parse` は早いほうを返します。この違いが結果に
影響する場面では、時刻表記の文字列ではなく時点そのものを保存してください。

**飛ばされた 1 時間は存在しません。** 時計が進むときにはその 1 時間が発生しないため、
`parse` はそれを拒否します。`parse('2024-03-10 02:30', 'YYYY-MM-DD HH:mm')` は
`America/New_York` では `INVALID_DATE` を投げ、`UTC` では成功します。つまり
時刻表記の文字列に対する `isValid` の答えはホストのタイムゾーンに依存します。
それを避けたい場合は、フォーマットにオフセットのトークンを入れてください。

**週は既定で日曜日から始まり**、`Date#getDay` に合わせています。ISO-8601 の週に
したい場合は `{ weekStartsOn: 1 }` を、あるいは `0` から `6` までの任意の曜日を
`startOf`、`endOf`、`equal`、`after`、`before` に渡してください。

```ts
startOf(stamp, 'week', { weekStartsOn: 1 }); // 月曜日
endOf(stamp, 'week', { weekStartsOn: 6 });   // 金曜日。土曜始まりの週の場合
```

`between(a, b, 'week')` にこのオプションは不要です。測るのは期間の長さであり、
週の開始曜日には左右されません。
