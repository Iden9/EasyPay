# EasyPay

易支付平台 SDK 集合，提供简单易用的支付接口封装。

## 项目结构

```
EasyPay/
├── sdk/
│   └── epay/          # 易支付 Node.js SDK
└── .github/
    └── workflows/     # GitHub Actions 自动发布
```

## SDK 列表

### epay-sdk

基于易支付平台 API 封装的 Node.js SDK，支持支付、查询、退款等功能。

**功能特性：**
- 页面跳转支付
- API 接口支付
- 订单查询（单个/批量）
- 商户信息查询
- 结算记录查询
- 订单退款
- 回调签名验证
- 完整的 TypeScript 类型支持

**支持的支付方式：**
- 支付宝 (alipay)
- 微信支付 (wxpay)

详细文档请查看 [sdk/epay/README.md](./sdk/epay/README.md)

## 快速开始

### 安装

```bash
# 从 GitHub Packages 安装
npm install @pengcunfu/epay-sdk

# 或本地路径安装
npm install file:./sdk/epay
```

### 使用示例

```javascript
const EpaySDK = require('@pengcunfu/epay-sdk');

// 创建实例
const epay = new EpaySDK({
  pid: '1001',
  key: 'your_key_here',
  apiUrl: 'https://pay.mlover.site'
});

// 生成支付链接
const payUrl = epay.generatePayUrl({
  outTradeNo: 'ORDER_001',
  name: 'VIP会员',
  money: 9.99,
  notifyUrl: 'https://your-site.com/notify',
  returnUrl: 'https://your-site.com/return'
});

// 查询订单
const order = await epay.queryOrder({
  outTradeNo: 'ORDER_001'
});
```

## 环境要求

- Node.js >= 14.0.0

## License

MIT
