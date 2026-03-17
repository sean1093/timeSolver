# timeSolver 使い方

このドキュメントは、`timeSolver` ライブラリの主要な関数、パラメータ、およびよく使うフォーマット例を示します。開発者が素早く始められるようにまとめています。

## インストールと読み込み

CommonJS:

```js
const timeSolver = require('timesolver');
```

ES Module:

```js
import timeSolver from 'timesolver';
```

ブラウザ（UMD バンドル）:

```html
<script src="dist/timeSolver.umd.min.js"></script>
<script>
  // グローバルに `timeSolver` が利用可能
  console.log(timeSolver.getString(new Date(), 'YYYYMMDD'));
</script>
```

## 主な API の概要

- `timeSolver.add(date, count, unit)` — `date` に `count` 単位を加算します。
- `timeSolver.subtract(date, count, unit)` — `date` から `count` 単位を減算します。
- `timeSolver.between(d1, d2, unit)` — `d2 - d1` の差を `unit` で返します。
- `timeSolver.equal(d1, d2)` — 2 つの日付が等しいかを判定します（文字列比較）。
- `timeSolver.after(d1, d2, unit)` — `d1` が `d2` より後かを判定します（`unit` 単位）。
- `timeSolver.before(d1, d2, unit)` — `d1` が `d2` より前かを判定します（`unit` 単位）。
- `timeSolver.afterToday(d)` / `timeSolver.beforeToday(d)` — 今日を基準とした比較。
- `timeSolver.getString(date, format)` — `date` を `format` で文字列にフォーマットします。
- `timeSolver.isValid(dateString, format?)` — 日付文字列を検証します。`format` が指定されていればそれに基づいて検証します。
- `timeSolver.getAbbrWeek(date)` / `timeSolver.getFullWeek(date)` — 曜日を取得（短縮形または全名）。
- `timeSolver.getAbbrMonth(date)` / `timeSolver.getFullMonth(date)` — 月を取得（短縮形または全名）。
- `timeSolver.getQuarterByMonth(m)` / `timeSolver.getFirstMonthByQuarter(q)` — 四半期ユーティリティ。

### 例

```js
const d = new Date('2020-01-01T00:00:00Z');
timeSolver.add(d, 1, 'D'); // 2020-01-02
timeSolver.subtract(d, 2, 'H'); // 2019-12-31 22:00
timeSolver.between('2020-01-01','2020-01-02','H'); // 24
timeSolver.getString(d, 'YYYY-MM-DD HH:MM:SS.SSS'); // e.g. '2020-01-01 00:00:00.000'
```

## サポートされる時間単位（`unit`）

ライブラリは複数の文字列または略語を受け付け、内部の単位インデックスへ変換します。サポートされる値は次の通りです：

- `MILLISECOND` または `mill` または 指定なし（デフォルト）
- `SECOND` または `S` または `s`
- `MINUTE` または `MIN`
- `HOUR` または `H`
- `DAY` または `D`
- `MONTH` または `M`
- `YEAR` または `Y`

例：`timeSolver.add(date, 5, 'H')` は 5 時間を加算します。

## `getString` のサポートフォーマット

`timeSolver.getString(date, format)` は以下のフォーマットパターンをサポートします（大文字小文字は区別されません）：

- `YYYY` — 年（例：`2020`）
- `YYYYMM` — `202001`
- `YYYYMMDD` — `20200101`
- `YYYY/MM/DD`, `YYYY-MM-DD`, `YYYY.MM.DD` — 一般的な区切り形式
- `MMDDYYYY`, `DDMMYYYY` — 月日年または日月年の順序
- 日付と時刻のフォーマット：
  - `YYYY/MM/DD HH:MM:SS`
  - `YYYY/MM/DD HH:MM:SS.SSS`（ミリ秒含む）
  - `YYYY-MM-DD HH:MM:SS` / `YYYY-MM-DD HH:MM:SS.SSS`
  - `YYYY.MM.DD HH:MM:SS` / `YYYY.MM.DD HH:MM:SS.SSS`
  - `YYYYMMDD HH:MM:SS` / `YYYYMMDD HH:MM:SS.SSS`
  - `MM/DD/YYYY HH:MM:SS` / `MM/DD/YYYY HH:MM:SS.SSS`
  - `MM-DD-YYYY HH:MM:SS` / `MM-DD-YYYY HH:MM:SS.SSS`
  - `MM.DD.YYYY HH:MM:SS` / `MM.DD.YYYY HH:MM:SS.SSS`
- 時刻のみ： `HH:MM:SS` / `HH:MM:SS.SSS`

例：

```js
timeSolver.getString(new Date('2020-06-15T13:45:30.123Z'), 'YYYY-MM-DD HH:MM:SS.SSS')
// => "2020-06-15 13:45:30.123"
```

## `isValid` の使い方

- `timeSolver.isValid('2020/01/01')` → `true`（`format` が省略された場合は `Date` 解析を使用）
- `timeSolver.isValid('2020/02/30', 'YYYY/MM/DD')` → `false`（不正な日付）

`format` が指定されている場合は、ビルトインのパターンで日付（および時刻）を検証し、必要に応じて追加チェックを行います。

## `timeLook`（軽量プロファイラ）

コードの区間をマークしてレポートを出力できます：

```js
timeSolver.timeLookStart();
// ... some operation ...
timeSolver.timeLook('step1');
// ... another operation ...
timeSolver.timeLook('step2');
timeSolver.timeLookReport();
```

レポートは各区間の経過時間と相対比率を表示し、最も時間のかかる区間をハイライトします。

## 追加情報

- 多くの関数は `Date` オブジェクトまたは `new Date(...)` で解析可能な文字列を受け取ります。
- 無効な日付を入力した場合、内部で `console.error` を出力し `null` を返します。

必要であれば、`docs/examples/` に個別のサンプルファイルとして分割することも可能です。
