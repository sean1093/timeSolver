# timeSolver 使用說明

這份文件說明 `timeSolver` 函式庫的主要方法、參數與常用格式範例，方便開發者快速上手。

## 安裝與引入

CommonJS:

```js
const timeSolver = require('timesolver');
```

ES Module:

```js
import timeSolver from 'timesolver';
```

Browser (UMD bundle):

```html
<script src="dist/timeSolver.umd.min.js"></script>
<script>
  // 全域物件 timeSolver 可直接使用
  console.log(timeSolver.getString(new Date(), 'YYYYMMDD'));
</script>
```

## 常用方法總覽

- `timeSolver.add(date, count, unit)` — 在 `date` 上加上 `count` 個 `unit`。
- `timeSolver.subtract(date, count, unit)` — 在 `date` 上減去 `count` 個 `unit`。
- `timeSolver.between(d1, d2, unit)` — 回傳 `d2 - d1` 的差距，單位為 `unit`。
- `timeSolver.equal(d1, d2)` — 判斷兩個日期是否相同（字串比對）。
- `timeSolver.after(d1, d2, unit)` — 判斷 `d1` 是否在 `d2` 之後（以 `unit` 計算）。
- `timeSolver.before(d1, d2, unit)` — 判斷 `d1` 是否在 `d2` 之前（以 `unit` 計算）。
- `timeSolver.afterToday(d)` / `timeSolver.beforeToday(d)` — 相對於今天的判斷。
- `timeSolver.getString(date, format)` — 將 `date` 轉成指定格式的字串。
- `timeSolver.isValid(dateString, format?)` — 驗證字串是否為合法日期；若提供 `format`，則以指定格式驗證。
- `timeSolver.getAbbrWeek(date)` / `timeSolver.getFullWeek(date)` — 取得星期（縮寫或全名）。
- `timeSolver.getAbbrMonth(date)` / `timeSolver.getFullMonth(date)` — 取得月份（縮寫或全名）。
- `timeSolver.getQuarterByMonth(m)` / `timeSolver.getFirstMonthByQuarter(q)` — 季度工具。

### 範例

```js
const d = new Date('2020-01-01T00:00:00Z');
timeSolver.add(d, 1, 'D'); // 2020-01-02
timeSolver.subtract(d, 2, 'H'); // 2019-12-31 22:00
timeSolver.between('2020-01-01','2020-01-02','H'); // 24
timeSolver.getString(d, 'YYYY-MM-DD HH:MM:SS.SSS'); // e.g. '2020-01-01 00:00:00.000'
```

## 支援的時間單位 (unit)

函式內部接受字串或縮寫，會轉成對應的單位編號。可使用的值包含：

- `MILLISECOND` 或 `mill` 或 不給（預設）
- `SECOND` 或 `S` 或 `s`
- `MINUTE` 或 `MIN`
- `HOUR` 或 `H`
- `DAY` 或 `D`
- `MONTH` 或 `M`
- `YEAR` 或 `Y`

例如： `timeSolver.add(date, 5, 'H')` 表示加 5 小時。

## getString 支援的格式

`timeSolver.getString(date, format)` 支援下列格式字串（大小寫會被標準化）：

- `YYYY` — 年份，例如 `2020`
- `YYYYMM` — `202001`
- `YYYYMMDD` — `20200101`
- `YYYY/MM/DD`, `YYYY-MM-DD`, `YYYY.MM.DD` — 常見日期分隔格式
- `MMDDYYYY`, `DDMMYYYY` — 月日年或日月年順序
- 帶時間的格式：
  - `YYYY/MM/DD HH:MM:SS`
  - `YYYY/MM/DD HH:MM:SS.SSS`（含毫秒）
  - `YYYY-MM-DD HH:MM:SS` / `YYYY-MM-DD HH:MM:SS.SSS`
  - `YYYY.MM.DD HH:MM:SS` / `YYYY.MM.DD HH:MM:SS.SSS`
  - `YYYYMMDD HH:MM:SS` / `YYYYMMDD HH:MM:SS.SSS`
  - `MM/DD/YYYY HH:MM:SS` / `MM/DD/YYYY HH:MM:SS.SSS`
  - `MM-DD-YYYY HH:MM:SS` / `MM-DD-YYYY HH:MM:SS.SSS`
  - `MM.DD.YYYY HH:MM:SS` / `MM.DD.YYYY HH:MM:SS.SSS`
- 時間-only： `HH:MM:SS` / `HH:MM:SS.SSS`

範例：

```js
timeSolver.getString(new Date('2020-06-15T13:45:30.123Z'), 'YYYY-MM-DD HH:MM:SS.SSS')
// => "2020-06-15 13:45:30.123"
```

## isValid 使用說明

- `timeSolver.isValid('2020/01/01')` → `true`（若 format 未給則使用 Date 解析）
- `timeSolver.isValid('2020/02/30', 'YYYY/MM/DD')` → `false`（不合法日期）

當 `format` 被提供時，會根據內建的正規表達式驗證日期與（若含時間）時間格式，並在必要時檢查時間部分是否存在。

## timeLook（簡易效能量測）

用來標記程式執行區段並列印報表：

```js
timeSolver.timeLookStart();
// ... some operation ...
timeSolver.timeLook('step1');
// ... another operation ...
timeSolver.timeLook('step2');
timeSolver.timeLookReport();
```

報表會在 console 顯示每段的花費時間與相對百分比，並標記最耗時的段落。

## 其他資訊

- 函式大多接受 `Date` 物件或可被 `new Date(...)` 解析的字串作為日期參數。
- 若輸入無效日期，會在內部 `console.error` 並回傳 `null`（例如 `_v` 檢查）。

如需我也可以將每個方法拆成示例放到 `docs/examples/`。
