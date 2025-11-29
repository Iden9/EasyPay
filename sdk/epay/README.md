# 易支付 SDK

基于易支付平台 API 封装的 Node.js SDK，支持支付、查询、退款等功能。

## 安装

### 从 GitHub Packages 安装

1. 创建或编辑项目根目录的 `.npmrc` 文件：

```
@pengcunfu:registry=https://npm.pkg.github.com
```

2. 登录 GitHub Packages（需要 GitHub Personal Access Token）：

```bash
npm login --scope=@pengcunfu --registry=https://npm.pkg.github.com
# Username: 你的 GitHub 用户名
# Password: 你的 Personal Access Token (需要 read:packages 权限)
```

3. 安装包：

```bash
npm install @pengcunfu/epay-sdk
# 或
yarn add @pengcunfu/epay-sdk
```

### 本地路径安装

如果在同一项目中使用，可以直接通过相对路径引用：

```bash
npm install file:./sdk/epay
```

## 快速开始

```javascript
const EpaySDK = require('@pengcunfu/epay-sdk');

// 创建实例
const epay = new EpaySDK({
  pid: '1001',           // 商户ID
  key: 'your_key_here',  // 商户密钥
  apiUrl: 'https://pay.mlover.site'  // 可选，API地址
});
```

## API 文档

### 1. 页面跳转支付

生成支付跳转 URL，用户点击后跳转到支付页面。

```javascript
const payUrl = epay.generatePayUrl({
  outTradeNo: 'ORDER_20231129001',  // 商户订单号
  name: 'VIP会员',                   // 商品名称
  money: 9.99,                       // 支付金额
  notifyUrl: 'https://your-site.com/notify',  // 异步通知地址
  returnUrl: 'https://your-site.com/return',  // 同步跳转地址
  type: 'alipay'  // 可选，支付方式：alipay/wxpay，不传则跳转收银台
});

// 跳转到 payUrl 进行支付
console.log(payUrl);
```

### 2. API 接口支付

服务端发起支付请求，返回支付二维码或跳转 URL。

```javascript
const result = await epay.createPayment({
  outTradeNo: 'ORDER_20231129001',
  name: 'VIP会员',
  money: 9.99,
  notifyUrl: 'https://your-site.com/notify',
  returnUrl: 'https://your-site.com/return',
  type: 'alipay',
  clientip: '192.168.1.100',  // 用户IP
  device: 'pc'  // 设备类型：pc/mobile/qq/wechat/alipay
});

if (result.code === 1) {
  // 支付请求成功
  console.log('支付订单号:', result.trade_no);
  console.log('支付URL:', result.payurl);
  console.log('二维码:', result.qrcode);
}
```

### 3. 查询订单

```javascript
// 通过商户订单号查询
const order = await epay.queryOrder({
  outTradeNo: 'ORDER_20231129001'
});

// 或通过易支付订单号查询
const order = await epay.queryOrder({
  tradeNo: '20231129123456789'
});

// 判断是否支付成功
if (EpaySDK.isPaymentSuccess(order)) {
  console.log('订单已支付');
}
```

### 4. 批量查询订单

```javascript
const orders = await epay.queryOrders({
  limit: 20,  // 返回数量，最大50
  page: 1     // 页码
});

console.log(orders.data);
```

### 5. 查询商户信息

```javascript
const merchant = await epay.queryMerchant();

console.log('商户余额:', merchant.money);
console.log('订单总数:', merchant.orders);
console.log('今日订单:', merchant.order_today);
```

### 6. 查询结算记录

```javascript
const settle = await epay.querySettle();
console.log(settle.data);
```

### 7. 订单退款

需要先在商户后台开启订单退款 API 接口开关。

```javascript
const result = await epay.refund({
  outTradeNo: 'ORDER_20231129001',  // 或 tradeNo
  money: 9.99  // 退款金额
});

if (result.code === 1) {
  console.log('退款成功');
}
```

### 8. 验证回调签名

```javascript
// Express 示例
app.get('/notify', (req, res) => {
  const params = req.query;

  // 验证签名
  if (!epay.verifySign(params)) {
    return res.send('fail');
  }

  // 验证支付状态
  if (EpaySDK.isNotifySuccess(params)) {
    // 支付成功，处理业务逻辑
    const orderNo = params.out_trade_no;
    const tradeNo = params.trade_no;
    const money = params.money;

    // TODO: 更新订单状态

    return res.send('success');
  }

  res.send('fail');
});
```

## 支付方式

| 调用值 | 描述 |
|--------|------|
| alipay | 支付宝 |
| wxpay  | 微信支付 |

```javascript
// 使用常量
EpaySDK.PaymentTypes.ALIPAY  // 'alipay'
EpaySDK.PaymentTypes.WXPAY   // 'wxpay'
```

## 设备类型

| 调用值 | 描述 |
|--------|------|
| pc     | 电脑浏览器 |
| mobile | 手机浏览器 |
| qq     | 手机QQ内浏览器 |
| wechat | 微信内浏览器 |
| alipay | 支付宝客户端 |
| jump   | 仅返回支付跳转url |

```javascript
// 使用常量
EpaySDK.DeviceTypes.PC      // 'pc'
EpaySDK.DeviceTypes.MOBILE  // 'mobile'
EpaySDK.DeviceTypes.WECHAT  // 'wechat'
```

## 回调参数说明

### 异步通知参数 (notify_url)

| 字段名 | 变量名 | 描述 |
|--------|--------|------|
| 商户ID | pid | |
| 易支付订单号 | trade_no | |
| 商户订单号 | out_trade_no | |
| 支付方式 | type | |
| 商品名称 | name | |
| 商品金额 | money | |
| 支付状态 | trade_status | TRADE_SUCCESS 为成功 |
| 业务扩展参数 | param | |
| 签名字符串 | sign | |
| 签名类型 | sign_type | |

## TypeScript 支持

SDK 包含完整的 TypeScript 类型定义。

```typescript
import EpaySDK, { CreatePaymentOptions, OrderInfo } from '@pengcunfu/epay-sdk';

const epay = new EpaySDK({
  pid: '1001',
  key: 'your_key'
});

const options: CreatePaymentOptions = {
  outTradeNo: 'ORDER_001',
  name: '商品',
  money: 9.99,
  notifyUrl: 'https://example.com/notify'
};

const result = await epay.createPayment(options);
```

## 错误处理

```javascript
try {
  const result = await epay.createPayment(options);
  if (result.code !== 1) {
    console.error('支付失败:', result.msg);
  }
} catch (error) {
  console.error('请求异常:', error.message);
}
```

## License

MIT
