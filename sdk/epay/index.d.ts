/**
 * 易支付 SDK TypeScript 类型定义
 */

declare module '@pengcunfu/epay-sdk' {
  export interface EpayConfig {
    /** 商户ID */
    pid: string | number;
    /** 商户密钥 */
    key: string;
    /** API地址，默认 https://pay.mlover.site */
    apiUrl?: string;
    /** 请求超时时间(毫秒)，默认 30000 */
    timeout?: number;
  }

  export interface CreatePaymentOptions {
    /** 商户订单号 */
    outTradeNo: string;
    /** 商品名称(最大127字节) */
    name: string;
    /** 支付金额(元，最大2位小数) */
    money: number | string;
    /** 异步通知地址 */
    notifyUrl: string;
    /** 同步跳转地址 */
    returnUrl?: string;
    /** 支付方式(alipay/wxpay)，默认 alipay */
    type?: 'alipay' | 'wxpay';
    /** 用户IP地址 */
    clientip?: string;
    /** 设备类型，默认 pc */
    device?: 'pc' | 'mobile' | 'qq' | 'wechat' | 'alipay' | 'jump';
    /** 业务扩展参数 */
    param?: string;
  }

  export interface GeneratePayUrlOptions {
    /** 商户订单号 */
    outTradeNo: string;
    /** 商品名称 */
    name: string;
    /** 支付金额 */
    money: number | string;
    /** 异步通知地址 */
    notifyUrl: string;
    /** 同步跳转地址 */
    returnUrl: string;
    /** 支付方式(不传则跳转到收银台) */
    type?: 'alipay' | 'wxpay';
    /** 业务扩展参数 */
    param?: string;
  }

  export interface QueryOrderOptions {
    /** 商户订单号 */
    outTradeNo?: string;
    /** 易支付订单号 */
    tradeNo?: string;
  }

  export interface QueryOrdersOptions {
    /** 返回订单数量(最大50)，默认 20 */
    limit?: number;
    /** 页码，默认 1 */
    page?: number;
  }

  export interface RefundOptions {
    /** 退款金额 */
    money: number | string;
    /** 商户订单号 */
    outTradeNo?: string;
    /** 易支付订单号 */
    tradeNo?: string;
  }

  export interface PaymentResult {
    /** 返回状态码，1为成功 */
    code: number;
    /** 返回信息 */
    msg?: string;
    /** 支付订单号 */
    trade_no?: string;
    /** 支付跳转url */
    payurl?: string;
    /** 二维码链接 */
    qrcode?: string;
    /** 小程序跳转url */
    urlscheme?: string;
  }

  export interface OrderInfo {
    /** 返回状态码，1为成功 */
    code: number;
    /** 返回信息 */
    msg?: string;
    /** 易支付订单号 */
    trade_no?: string;
    /** 商户订单号 */
    out_trade_no?: string;
    /** 第三方订单号 */
    api_trade_no?: string;
    /** 支付方式 */
    type?: string;
    /** 商户ID */
    pid?: string | number;
    /** 创建订单时间 */
    addtime?: string;
    /** 完成交易时间 */
    endtime?: string;
    /** 商品名称 */
    name?: string;
    /** 商品金额 */
    money?: string;
    /** 支付状态，1为支付成功，0为未支付 */
    status?: number | string;
    /** 业务扩展参数 */
    param?: string;
    /** 支付者账号 */
    buyer?: string;
  }

  export interface MerchantInfo {
    /** 返回状态码，1为成功 */
    code: number;
    /** 商户ID */
    pid?: number;
    /** 商户密钥 */
    key?: string;
    /** 商户状态，1为正常，0为封禁 */
    active?: number;
    /** 商户余额 */
    money?: string;
    /** 结算方式 */
    type?: number;
    /** 结算账号 */
    account?: string;
    /** 结算姓名 */
    username?: string;
    /** 订单总数 */
    orders?: number;
    /** 今日订单 */
    order_today?: number;
    /** 昨日订单 */
    order_lastday?: number;
  }

  export interface NotifyParams {
    /** 商户ID */
    pid: string | number;
    /** 易支付订单号 */
    trade_no: string;
    /** 商户订单号 */
    out_trade_no: string;
    /** 支付方式 */
    type: string;
    /** 商品名称 */
    name: string;
    /** 商品金额 */
    money: string;
    /** 支付状态 */
    trade_status: 'TRADE_SUCCESS' | string;
    /** 业务扩展参数 */
    param?: string;
    /** 签名字符串 */
    sign: string;
    /** 签名类型 */
    sign_type: string;
  }

  export interface RefundResult {
    /** 返回状态码，1为成功 */
    code: number;
    /** 返回信息 */
    msg: string;
  }

  export default class EpaySDK {
    constructor(config: EpayConfig);

    /** 商户ID */
    pid: string | number;
    /** 商户密钥 */
    key: string;
    /** API地址 */
    apiUrl: string;
    /** 请求超时时间 */
    timeout: number;

    /**
     * 生成 MD5 签名
     */
    generateSign(params: Record<string, any>): string;

    /**
     * 验证签名
     */
    verifySign(params: Record<string, any>): boolean;

    /**
     * 发起 API 支付请求
     */
    createPayment(options: CreatePaymentOptions): Promise<PaymentResult>;

    /**
     * 生成页面跳转支付 URL
     */
    generatePayUrl(options: GeneratePayUrlOptions): string;

    /**
     * 查询单个订单
     */
    queryOrder(options: QueryOrderOptions): Promise<OrderInfo>;

    /**
     * 批量查询订单
     */
    queryOrders(options?: QueryOrdersOptions): Promise<{ code: number; msg?: string; data?: OrderInfo[] }>;

    /**
     * 查询商户信息
     */
    queryMerchant(): Promise<MerchantInfo>;

    /**
     * 查询结算记录
     */
    querySettle(): Promise<{ code: number; msg?: string; data?: any[] }>;

    /**
     * 提交订单退款
     */
    refund(options: RefundOptions): Promise<RefundResult>;

    /**
     * 判断订单是否支付成功
     */
    static isPaymentSuccess(orderInfo: OrderInfo): boolean;

    /**
     * 判断回调通知是否支付成功
     */
    static isNotifySuccess(notifyParams: NotifyParams): boolean;

    /** 支付方式列表 */
    static PaymentTypes: {
      ALIPAY: 'alipay';
      WXPAY: 'wxpay';
    };

    /** 设备类型列表 */
    static DeviceTypes: {
      PC: 'pc';
      MOBILE: 'mobile';
      QQ: 'qq';
      WECHAT: 'wechat';
      ALIPAY: 'alipay';
      JUMP: 'jump';
    };
  }
}
