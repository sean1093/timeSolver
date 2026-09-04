# 使用指南

timeSolver 2.x 的任務導向導覽。完整的函式簽章請見 [API 參考文件](api.md)；
從 1.x 升級請見[遷移指南](migration-v1-v2.md)；
全部文件的索引請見[文件總覽](README.md)。

也有 [English](usage.md) 與 [日本語](usage.ja.md) 版本。

API 參考文件、範例集與支援政策目前只有英文版。

## 安裝與匯入

```sh
npm install timesolver
```

```ts
// 只匯入你用得到的部分，其餘會被 tree-shaking 移除。後續範例假設你已匯入
// 它們所呼叫的函式。
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
<!-- 瀏覽器環境，不使用打包工具 -->
<script src="https://unpkg.com/timesolver/dist/timesolver.global.js"></script>
<script>
  timeSolver.getString(new Date(), 'YYYY-MM-DD');
</script>
```

每個函式都接受 `Date`、epoch 毫秒數，或是語言內建 `Date` 能夠解析的字串，
並且一律以主機所在的時區運作。

## 格式化日期

```ts
const stamp = new Date(2024, 2, 17, 14, 30, 45, 123); // 2024 年 3 月 17 日，星期日

getString(stamp);                            // '20240317'  （預設格式）
getString(stamp, 'YYYY-MM-DD');              // '2024-03-17'
getString(stamp, 'YYYY-MM-DD HH:mm:ss.SSS'); // '2024-03-17 14:30:45.123'
getString(stamp, 'ddd, D MMM YYYY');         // 'Sun, 17 Mar 2024'
getString(stamp, 'h:mm a');                  // '2:30 pm'
getString(stamp, '[Quarter] Q [of] YYYY');   // 'Quarter 1 of 2024'
```

大寫符號代表較大的單位，小寫代表較小的單位：`MM` 是月份，`mm` 是分鐘；
`DD` 是日，`dddd` 是星期名稱。字面文字請用中括號包起來，
裡面的字母才不會被當成格式符號解讀。

完整的格式符號（token）表格請見 [API 參考文件](api.md#tokens)。
有兩種格式會被拒絕，兩者都拋出 `INVALID_FORMAT`：

```ts
getString(stamp, 'YYYYMD'); // 拋出例外：'M' 緊接著 'D'，'2024112' 無從判讀
getString(stamp, 'nope');   // 拋出例外：完全沒有格式符號；請改用 '[nope]'
```

請注意，單一字母也是格式符號：`'oops'` 會輸出 `'oop45'`，因為 `s` 就是秒數符號。
凡是不想被當成格式符號的字面文字，都要記得跳脫。

1.x 接受過的格式名稱全部仍然可用，
所以 `getString(stamp, 'YYYY-MM-DD HH:MM:SS')` 依舊會輸出
`'2024-03-17 14:30:45'`。這些名稱不分大小寫，唯一的例外是本身就構成合法格式
符號串的寫法：`'hh:mm:ss'` 是 12 小時制的時、分、秒，因此會輸出
`'02:30:45'`，而不是同一串小寫在 1.x 代表的 24 小時制。

## 從字串讀取日期

`parse` 非常嚴格：輸入必須與格式完全相符，
而且解析出來的日期再格式化回去也必須是同一個字串。

```ts
parse('17/03/2024', 'DD/MM/YYYY');                  // 2024-03-17 00:00 當地時間
parse('2024-03-17 14:30', 'YYYY-MM-DD HH:mm');      // 帶時間
parse('03/17/2024 02:30 PM', 'MM/DD/YYYY hh:mm A'); // 12 小時制

parse('31/02/2024', 'DD/MM/YYYY'); // 拋出例外：二月沒有 31 日
parse('2024-3-7', 'YYYY-MM-DD');   // 拋出例外：補零位數不符
```

格式沒有涵蓋的欄位一律預設為 1970-01-01，
所以 `parse('12:30:00', 'HH:mm:ss')` 得到的是 epoch 當天的時間，
很適合用來比較一天當中的時刻。

## 驗證輸入

```ts
isValid('2020-01-01');               // true  — Date 讀得懂的都算
isValid('nope');                     // false
isValid('2020-02-29', 'YYYY-MM-DD'); // true  — 2020 是閏年
isValid('2021-02-29', 'YYYY-MM-DD'); // false
isValid('31-02-2020', 'DD-MM-YYYY'); // false — 不存在的日期
isValid('12:30:00', 'HH:mm:ss');     // true
```

`isValid` 遇到錯誤資料絕不拋出例外，
因此很適合放在會拋出例外的函式之前當作防護：

```ts
function shiftDeadline(input: unknown, days: number): Date | undefined {
  if (typeof input !== 'string' || !isValid(input, 'YYYY-MM-DD')) {
    return undefined;
  }
  return add(parse(input, 'YYYY-MM-DD'), days, 'day');
}
```

## 加減運算

所有操作都是不可變的：輸入永遠不會被修改，每次呼叫都回傳新的 `Date`。

```ts
add(stamp, 90, 'minute');    // 實際經過的時間
add(stamp, 1, 'day');        // 明天的同一個時鐘時間，有沒有日光節約時間都一樣
add(stamp, 1, 'week');
add(stamp, 1, 'month');      // 會截到月底：1 月 31 日加一個月是 2 月 29 日
add(stamp, -1, 'year');
subtract(stamp, 2, 'hour');
```

單位名稱不分大小寫，也接受 1.x 的縮寫：`'D'`、`'H'`、`'MIN'`、
代表月的 `'M'`、代表年的 `'Y'`。

毫秒到小時可以使用小數；日以及更大的單位則不接受小數，
因為這些單位的小數沒有固定長度：

```ts
add(stamp, 1.5, 'hour');  // 可以
add(stamp, 1.5, 'month'); // 拋出 INVALID_ARGUMENT
```

## 日曆區間

```ts
startOf(stamp, 'day');     // 2024-03-17 00:00:00.000
endOf(stamp, 'day');       // 2024-03-17 23:59:59.999
startOf(stamp, 'week');    // 2024-03-17 00:00（一週從星期日開始）
startOf(stamp, 'week', { weekStartsOn: 1 }); // 2024-03-11 00:00（ISO-8601）
startOf(stamp, 'month');   // 2024-03-01 00:00
endOf(stamp, 'month');     // 2024-03-31 23:59:59.999
startOf(stamp, 'quarter'); // 2024-01-01 00:00
```

例如查詢本月至今的資料：

```ts
const monthStart = startOf(new Date(), 'month');
const monthEnd = endOf(new Date(), 'month');
const rows = all.filter((row) => isBetween(row.createdAt, monthStart, monthEnd));
```

連續銜接的區間請改用半開區間，這樣既不會重疊，也不會留下空隙：

```ts
isBetween(date, monthStart, add(monthStart, 1, 'month'), { bounds: '[)' });
```

## 比較與計算差距

```ts
between('2020-01-01T00:00', '2020-01-02T00:00', 'hour');  // 24
between('2020-01-01T00:00', '2020-02-01T00:00', 'month'); // 1
between('2020-01-01T00:00', '2020-01-16T00:00', 'month'); // 0.4838…
```

計算基準會依單位而異，讓每個答案都符合該單位應有的語意：

- 毫秒到小時計算**實際經過的時間**，所以春季日光節約時間轉換那天只有 23 小時，結果就是 `23`；
- 日與週依照**當地日曆**計算，所以那一天算 `1`，跨過那天的中午到中午也是 `1`；
- 月、季與年依照**日曆**計算，餘數則依所落在的月份長度換算。

`between(a, b, unit)` 永遠等於 `between(b, a, unit)` 取負號。

比較函式可以帶入選用的單位，用來決定比較的精細度：

```ts
equal('2024-03-17T01:00', '2024-03-17T23:00', 'day'); // true，同一天
after('2024-03-17T23:00', '2024-03-17T01:00');        // true，時間點較晚
after('2024-03-17T23:00', '2024-03-17T01:00', 'day'); // false，同一天
afterToday(add(new Date(), 1, 'day'));                // true
beforeToday(new Date());                              // false
```

## 區間

```ts
isBetween('2024-03-15T12:00', '2024-03-01T00:00', '2024-04-01T00:00');       // true
isBetween('2024-04-01T00:00', '2024-03-01T00:00', '2024-04-01T00:00', { bounds: '[)' }); // false
min('2024-03-17T00:00', '2024-01-01T00:00');                                 // 2024-01-01
max('2024-03-17T00:00', '2024-01-01T00:00');                                 // 2024-03-17
clamp('2024-06-01T00:00', '2024-01-01T00:00', '2024-03-01T00:00');           // 2024-03-01
```

`isBetween` 的邊界以區間符號表示：`'[]'`、`'[)'`、`'(]'` 或 `'()'`。
區間前後相連時請選 `'[)'`，這樣既不會重疊，也不會留下空隙。
它同樣接受單位與 `weekStartsOn`，和上面的比較函式一致。
`clamp` 的下界若晚於上界就會拋出例外。

## 日曆輔助函式

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

週數有兩種算法，因為這兩套慣例在跨年時的答案並不一致：

```ts
getISOWeek('2024-12-30T12:00');     // 1  -- ISO-8601：第 1 週從星期一開始
getISOWeekYear('2024-12-30T12:00'); // 2025，不是 2024

getWeekOfYear('2024-12-30T12:00');  // 53 -- 日曆年，第 1 週包含 1 月 1 日
```

ISO 的年與週請成對輸出，切勿把 `YYYY` 與 ISO 週數並用：

```ts
`${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`; // '2025-W01'
```

這些名稱一律是英文，而且來自固定的對照表，
不會因為引擎或語系設定而改變。需要在地化輸出時，
請自行用 `Intl.DateTimeFormat` 格式化你需要的部分。

## 處理錯誤

錯誤的輸入會拋出 `TimeSolverError`，上面帶有可以用來分支處理的 `code`：

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

函式庫不會輸出任何東西到 console，也沒有任何函式會用 `null` 當作失敗的代表值。

## 分析效能瓶頸

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

每個 profiler 各自擁有一條時間軸，因此巢狀量測不會互相干擾；
`report()` 會回傳 `{ total, slowest, marks }`，可以直接用來斷言或送進監控指標，
不必依賴 console 輸出。1.x 的 `timeLookStart`、`timeLook` 與 `timeLookReport`
這三個名稱仍然存在，因此 1.x 的程式碼與 1.x 的 `<script>` 標籤都能繼續運作。

## 注意事項

**字串解析沿用語言本身的規則。** `new Date('2024-03-10')` 是 UTC 午夜，
`new Date('2024-03-10T00:00')` 則是當地時間。本套件會把字串直接交給 `Date`，
所以同一套規則也適用。若這點會影響結果，請改傳 `Date`、把時間一併寫上，
或改用 `parse` 指定明確的格式。

**沒有時區概念。** 一切都以主機當地時間為準。`Z` 與 `ZZ` 可以輸出目前的時差，
`parse` 也讀得回來——時差只是加減運算，不需要時區資料，所以解析出的時間點是精確的
——但這個函式庫不認得任何時區名稱。需要處理時區時，請改用 `Temporal` 或
`Intl.DateTimeFormat`。

**重複的那一小時是有歧義的。** 時鐘往回調時，同一個時鐘讀數會對應到兩個時間點，
而 `parse` 會解析成較早的那一個。這個差別若會影響結果，
請儲存時間點本身，而不是時鐘讀數的字串。

**被跳過的那一小時不存在。** 時鐘往前調時，那一小時根本沒有發生，
`parse` 因此會拒絕它：`parse('2024-03-10 02:30', 'YYYY-MM-DD HH:mm')`
在 `America/New_York` 會拋出 `INVALID_DATE`，在 `UTC` 則正常解析。
也就是說，時鐘讀數字串的 `isValid` 結果會隨主機時區而異；
若不希望如此，請在格式中加入時差符號。

**一週預設從星期日開始**，與 `Date#getDay` 一致。想要 ISO-8601 的一週，
請把 `{ weekStartsOn: 1 }`，或是 `0` 到 `6` 之間的任何一天，傳給
`startOf`、`endOf`、`equal`、`after` 與 `before`：

```ts
startOf(stamp, 'week', { weekStartsOn: 1 }); // 星期一
endOf(stamp, 'week', { weekStartsOn: 6 });   // 星期五，對應星期六起始的一週
```

`between(a, b, 'week')` 不需要這個選項：它量的是一段跨距，
與一週從哪一天開始無關。
