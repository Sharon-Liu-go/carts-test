const crypto = require("crypto")

const URL = process.env.NEWEBPAY_URL || "/"
const MerchantID = "MS318730941"
const HashKey = 'etqEZfGMc9ZPfz9yXiF72hi1DBgi4wrY'
const HashIV = 'CeWmgYPUmZa8pLRP'
const PayGateWay = "https://ccore.newebpay.com/MPG/mpg_gateway"
const ReturnURL = URL + "/newebpay/callback?from=ReturnURL"
const NotifyURL = URL + "/newebpay/callback?from=NotifyURL"
const ClientBackURL = URL + '/clientBack'
// URL + "/clientBack"

//取得付款方式的參數
function getPayParam(method) {
  switch (method) {
    case '1': return 'CREDIT'
  }
}

//取得MerchantOrderNo （訂單號碼＋一組五個數字(0-9）
function tradeNo(orderNo) {
  let tradeNo = ""
  for (let i = 0; i < 5; i++) {
    let x = Math.floor(Math.random() * 10)
    tradeNo = tradeNo + x
  }
  orderNo = orderNo + tradeNo
  return orderNo
}

function genDataChain(TradeInfo) {
  let results = [];
  for (let kv of Object.entries(TradeInfo)) {
    results.push(`${kv[0]}=${kv[1]}`);
  }
  return results.join("&");
}

function create_mpg_aes_encrypt(TradeInfo) {
  let encrypt = crypto.createCipheriv("aes256", HashKey, HashIV);
  let enc = encrypt.update(genDataChain(TradeInfo), "utf8", "hex");
  return enc + encrypt.final("hex");
}

function create_mpg_aes_decrypt(TradeInfo) {
  let decrypt = crypto.createDecipheriv("aes256", HashKey, HashIV);
  decrypt.setAutoPadding(false);
  let text = decrypt.update(TradeInfo, "hex", "utf8");
  let plainText = text + decrypt.final("utf8");
  let result = plainText.replace(/[\x00-\x20]+/g, "");
  return result;
}


function create_mpg_sha_encrypt(TradeInfo) {

  let sha = crypto.createHash("sha256");
  let plainText = `HashKey=${HashKey}&${TradeInfo}&HashIV=${HashIV}`

  return sha.update(plainText).digest("hex").toUpperCase();
}

function getTradeInfo(Amt, Desc, email, paymentMethod, orderSn) {

  console.log('===== getTradeInfo =====')
  console.log(Amt, Desc, email, paymentMethod, orderSn)
  console.log('==========')

  data = {
    'MerchantID': MerchantID, // 商店代號
    'RespondType': 'JSON', // 回傳格式
    'TimeStamp': Date.now(), // 時間戳記
    'Version': 1.5, // 串接程式版本
    'MerchantOrderNo': tradeNo(orderSn ? orderSn : Date.now()), // 商店訂單編號
    'LoginType': 0, // 智付通會員
    'OrderComment': 'OrderComment', // 商店備註
    'Amt': Amt, // 訂單金額
    'ItemDesc': Desc, // 產品名稱
    'Email': email, // 付款人電子信箱
    'ReturnURL': ReturnURL,
    // `${ReturnURL}/${orderSn ? orderSn : Date.now()}`, // 支付完成返回商店網址
    'NotifyURL': NotifyURL, // 支付通知網址/每期授權結果通知
    // 'ClientBackURL': ClientBackURL, // 支付取消返回商店網址
    'ClientBackURL': `${ClientBackURL}/${orderSn ? orderSn : Date.now()}`, // 支付取消返回商店網址
  }
  //加入paymentMethod的參數，啟用:1

  data[paymentMethod] = 1

  console.log('===== getTradeInfo: data =====')
  console.log(data)


  mpg_aes_encrypt = create_mpg_aes_encrypt(data)
  mpg_sha_encrypt = create_mpg_sha_encrypt(mpg_aes_encrypt)

  console.log('===== getTradeInfo: mpg_aes_encrypt, mpg_sha_encrypt =====')
  console.log(mpg_aes_encrypt)
  console.log(mpg_sha_encrypt)

  tradeInfo = {
    'MerchantID': MerchantID, // 商店代號
    'TradeInfo': mpg_aes_encrypt, // 加密後參數
    'TradeSha': mpg_sha_encrypt,
    'Version': 1.5, // 串接程式版本
    'PayGateWay': PayGateWay,
    'MerchantOrderNo': data.MerchantOrderNo,
  }

  console.log('===== getTradeInfo: tradeInfo =====')
  console.log(tradeInfo)

  return tradeInfo
}

module.exports = {
  getPayParam,
  genDataChain,
  create_mpg_aes_decrypt,
  create_mpg_sha_encrypt,
  getTradeInfo
}