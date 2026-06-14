/**
 * 小黑盒 API 签名生成脚本
 * Usage: node scripts/sign.js <api_path>
 * Output: JSON { hkey, _time, nonce }
 * 
 * 基于小黑盒 nuxt_app.js 中的 vv/ov 算法，含 Km (AES MixColumns) 变换
 */

const crypto = require("crypto");

// ===== AES MixColumns 子函数 =====
function Vm(e) { return 128 & e ? 255 & (e << 1 ^ 27) : e << 1; }
function qm(e) { return Vm(e) ^ e; }
function __$m(e) { return qm(Vm(e)); }
function Ym(e) { return __$m(qm(Vm(e))); }
function Gm(e) { return Ym(e) ^ __$m(e) ^ qm(e); }

function Km(arr) {
  var t = [0, 0, 0, 0];
  t[0] = Gm(arr[0]) ^ Ym(arr[1]) ^ __$m(arr[2]) ^ qm(arr[3]);
  t[1] = qm(arr[0]) ^ Gm(arr[1]) ^ Ym(arr[2]) ^ __$m(arr[3]);
  t[2] = __$m(arr[0]) ^ qm(arr[1]) ^ Gm(arr[2]) ^ Ym(arr[3]);
  t[3] = Ym(arr[0]) ^ __$m(arr[1]) ^ qm(arr[2]) ^ Gm(arr[3]);
  arr[0] = t[0]; arr[1] = t[1]; arr[2] = t[2]; arr[3] = t[3];
  return arr;
}

// ===== 签名核心函数 =====
const TABLE = "AB45STUVWZEFGJ6CH01D237IXYPQRKLMN89";

function sv(s, table) {
  var result = "";
  for (var i = 0; i < s.length; i++) {
    result += table[s.charCodeAt(i) % table.length];
  }
  return result;
}

function av(s, table, n) {
  var rt = table.slice(0, n);
  var result = "";
  for (var i = 0; i < s.length; i++) {
    result += rt[s.charCodeAt(i) % rt.length];
  }
  return result;
}

function ov(urlPath, timestamp, nonce) {
  var cleanPath = "/" + urlPath.split("/").filter(function(x) { return x; }).join("/") + "/";
  var arrays = [
    av(String(timestamp), TABLE, -2),
    sv(cleanPath, TABLE),
    sv(nonce, TABLE)
  ];

  // Interleaved: 按列交织三个数组的元素
  var interleaved = "";
  var maxLen = Math.max(arrays[0].length, arrays[1].length, arrays[2].length);
  for (var col = 0; col < maxLen; col++) {
    for (var i = 0; i < 3; i++) {
      if (col < arrays[i].length) {
        interleaved += arrays[i][col];
      }
    }
  }
  interleaved = interleaved.slice(0, 20);

  // MD5
  var md5Hash = crypto.createHash("md5").update(interleaved).digest("hex");

  // Km 变换最后 6 个字符的 charCode + 求和 % 100
  var last6 = md5Hash.slice(-6).split("").map(function(c) { return c.charCodeAt(); });
  var kmOut = Km(last6);
  var total = kmOut.reduce(function(s, v) { return s + v; }, 0);
  var a = String(total % 100);
  if (a.length < 2) a = "0" + a;

  // av 取前 5 个字符
  var sFinal = av(md5Hash.substring(0, 5), TABLE, -4);
  return sFinal + a;
}

function generateSignature(apiPath) {
  var t = Math.floor(Date.now() / 1000);
  var r = crypto.createHash("md5").update(String(t) + Math.random().toString()).digest("hex").toUpperCase();
  var hkey = ov(apiPath, t + 1, r);
  return { hkey: hkey, _time: t, nonce: r };
}

// CLI entry
var apiPath = process.argv[2] || "/bbs/app/link/tree";
var result = generateSignature(apiPath);
console.log(JSON.stringify(result));