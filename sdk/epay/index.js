/**
 * 易支付 SDK
 * 基于易支付平台 API 封装的 Node.js SDK
 *
 * @author FireNebShop
 * @version 1.0.0
 */

const crypto = require('crypto');
const axios = require('axios');

class EpaySDK {
  /**
   * 创建易支付 SDK 实例
   * @param {Object} config - 配置项
   * @param {string} config.pid - 商户ID
   * @param {string} config.key - 商户密钥
   * @param {string} [config.apiUrl='https://pay.mlover.site'] - API地址
   * @param {number} [config.timeout=30000] - 请求超时时间(毫秒)
   */
  constructor(config) {
    if (!config.pid || !config.key) {
      throw new Error('pid 和 key 是必填参数');
    }

    this.pid = config.pid;
    this.key = config.key;
    this.apiUrl = config.apiUrl || 'https://pay.mlover.site';
    this.timeout = config.timeout || 30000;

    // 创建 axios 实例
    this.http = axios.create({
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }

  // ==================== 签名相关 ====================

  /**
   * 生成 MD5 签名
   * @param {Object} params - 参与签名的参数
   * @returns {string} - MD5 签名(小写)
   */
  generateSign(params) {
    // 1. 过滤空值和 sign、sign_type 参数
    const filteredParams = {};
    for (const [k, v] of Object.entries(params)) {
      if (k !== 'sign' && k !== 'sign_type' && v !== '' && v !== null && v !== undefined) {
        filteredParams[k] = v;
      }
    }

    // 2. 按参数名 ASCII 码从小到大排序
    const sortedKeys = Object.keys(filteredParams).sort();

    // 3. 拼接成 URL 键值对格式
    const queryString = sortedKeys
      .map(k => `${k}=${filteredParams[k]}`)
      .join('&');

    // 4. 拼接密钥并进行 MD5 加密
    const signStr = queryString + this.key;
    return crypto.createHash('md5').update(signStr, 'utf8').digest('hex');
  }

  /**
   * 验证签名
   * @param {Object} params - 回调参数
   * @returns {boolean} - 签名是否有效
   */
  verifySign(params) {
    const receivedSign = params.sign;
    if (!receivedSign) {
      return false;
    }
    const calculatedSign = this.generateSign(params);
    return receivedSign.toLowerCase() === calculatedSign.toLowerCase();
  }

  // ==================== 支付相关 ====================

  /**
   * 发起 API 支付请求
   * 返回支付二维码链接或支付跳转 URL
   *
   * @param {Object} options - 支付参数
   * @param {string} options.outTradeNo - 商户订单号
   * @param {string} options.name - 商品名称(最大127字节)
   * @param {number|string} options.money - 支付金额(元，最大2位小数)
   * @param {string} options.notifyUrl - 异步通知地址
   * @param {string} [options.returnUrl] - 同步跳转地址
   * @param {string} [options.type='alipay'] - 支付方式(alipay/wxpay)
   * @param {string} [options.clientip] - 用户IP地址
   * @param {string} [options.device='pc'] - 设备类型(pc/mobile/qq/wechat/alipay)
   * @param {string} [options.param] - 业务扩展参数
   * @returns {Promise<Object>} - 支付结果
   */
  async createPayment(options) {
    const {
      outTradeNo,
      name,
      money,
      notifyUrl,
      returnUrl,
      type = 'alipay',
      clientip = '127.0.0.1',
      device = 'pc',
      param = ''
    } = options;

    // 构建请求参数
    const params = {
      pid: this.pid,
      type,
      out_trade_no: outTradeNo,
      notify_url: notifyUrl,
      name: String(name).substring(0, 127),
      money: parseFloat(money).toFixed(2),
      clientip,
      device,
      sign_type: 'MD5'
    };

    if (returnUrl) {
      params.return_url = returnUrl;
    }

    if (param) {
      params.param = param;
    }

    // 生成签名
    params.sign = this.generateSign(params);

    // 发起请求
    const response = await this.http.post(
      `${this.apiUrl}/mapi.php`,
      new URLSearchParams(params).toString()
    );

    return response.data;
  }

  /**
   * 生成页面跳转支付 URL
   * 用于前台直接跳转支付
   *
   * @param {Object} options - 支付参数
   * @param {string} options.outTradeNo - 商户订单号
   * @param {string} options.name - 商品名称
   * @param {number|string} options.money - 支付金额
   * @param {string} options.notifyUrl - 异步通知地址
   * @param {string} options.returnUrl - 同步跳转地址
   * @param {string} [options.type] - 支付方式(不传则跳转到收银台)
   * @param {string} [options.param] - 业务扩展参数
   * @returns {string} - 支付跳转 URL
   */
  generatePayUrl(options) {
    const {
      outTradeNo,
      name,
      money,
      notifyUrl,
      returnUrl,
      type,
      param = ''
    } = options;

    // 构建请求参数
    const params = {
      pid: this.pid,
      out_trade_no: outTradeNo,
      notify_url: notifyUrl,
      return_url: returnUrl,
      name: String(name).substring(0, 127),
      money: parseFloat(money).toFixed(2),
      sign_type: 'MD5'
    };

    if (type) {
      params.type = type;
    }

    if (param) {
      params.param = param;
    }

    // 生成签名
    params.sign = this.generateSign(params);

    // 构建 URL
    const queryString = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');

    return `${this.apiUrl}/submit.php?${queryString}`;
  }

  // ==================== 查询相关 ====================

  /**
   * 查询单个订单
   *
   * @param {Object} options - 查询参数
   * @param {string} [options.outTradeNo] - 商户订单号
   * @param {string} [options.tradeNo] - 易支付订单号
   * @returns {Promise<Object>} - 订单信息
   */
  async queryOrder(options = {}) {
    const { outTradeNo, tradeNo } = options;

    if (!outTradeNo && !tradeNo) {
      throw new Error('outTradeNo 或 tradeNo 至少需要传一个');
    }

    const params = {
      act: 'order',
      pid: this.pid,
      key: this.key
    };

    if (tradeNo) {
      params.trade_no = tradeNo;
    } else {
      params.out_trade_no = outTradeNo;
    }

    const queryString = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');

    const response = await this.http.get(`${this.apiUrl}/api.php?${queryString}`);
    return response.data;
  }

  /**
   * 批量查询订单
   *
   * @param {Object} [options] - 查询参数
   * @param {number} [options.limit=20] - 返回订单数量(最大50)
   * @param {number} [options.page=1] - 页码
   * @returns {Promise<Object>} - 订单列表
   */
  async queryOrders(options = {}) {
    const { limit = 20, page = 1 } = options;

    const params = {
      act: 'orders',
      pid: this.pid,
      key: this.key,
      limit: Math.min(limit, 50),
      page
    };

    const queryString = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');

    const response = await this.http.get(`${this.apiUrl}/api.php?${queryString}`);
    return response.data;
  }

  /**
   * 查询商户信息
   *
   * @returns {Promise<Object>} - 商户信息
   */
  async queryMerchant() {
    const params = {
      act: 'query',
      pid: this.pid,
      key: this.key
    };

    const queryString = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');

    const response = await this.http.get(`${this.apiUrl}/api.php?${queryString}`);
    return response.data;
  }

  /**
   * 查询结算记录
   *
   * @returns {Promise<Object>} - 结算记录
   */
  async querySettle() {
    const params = {
      act: 'settle',
      pid: this.pid,
      key: this.key
    };

    const queryString = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');

    const response = await this.http.get(`${this.apiUrl}/api.php?${queryString}`);
    return response.data;
  }

  // ==================== 退款相关 ====================

  /**
   * 提交订单退款
   * 需要先在商户后台开启订单退款 API 接口开关
   *
   * @param {Object} options - 退款参数
   * @param {number|string} options.money - 退款金额
   * @param {string} [options.outTradeNo] - 商户订单号
   * @param {string} [options.tradeNo] - 易支付订单号
   * @returns {Promise<Object>} - 退款结果
   */
  async refund(options) {
    const { money, outTradeNo, tradeNo } = options;

    if (!outTradeNo && !tradeNo) {
      throw new Error('outTradeNo 或 tradeNo 至少需要传一个');
    }

    if (!money) {
      throw new Error('money 是必填参数');
    }

    const params = {
      pid: this.pid,
      key: this.key,
      money: parseFloat(money).toFixed(2)
    };

    if (tradeNo) {
      params.trade_no = tradeNo;
    } else {
      params.out_trade_no = outTradeNo;
    }

    const response = await this.http.post(
      `${this.apiUrl}/api.php?act=refund`,
      new URLSearchParams(params).toString()
    );

    return response.data;
  }

  // ==================== 工具方法 ====================

  /**
   * 判断订单是否支付成功
   *
   * @param {Object} orderInfo - 订单查询结果
   * @returns {boolean} - 是否支付成功
   */
  static isPaymentSuccess(orderInfo) {
    return orderInfo.code === 1 && (orderInfo.status === 1 || orderInfo.status === '1');
  }

  /**
   * 判断回调通知是否支付成功
   *
   * @param {Object} notifyParams - 回调参数
   * @returns {boolean} - 是否支付成功
   */
  static isNotifySuccess(notifyParams) {
    return notifyParams.trade_status === 'TRADE_SUCCESS';
  }

  /**
   * 支付方式列表
   */
  static PaymentTypes = {
    ALIPAY: 'alipay',
    WXPAY: 'wxpay'
  };

  /**
   * 设备类型列表
   */
  static DeviceTypes = {
    PC: 'pc',
    MOBILE: 'mobile',
    QQ: 'qq',
    WECHAT: 'wechat',
    ALIPAY: 'alipay',
    JUMP: 'jump'
  };
}

module.exports = EpaySDK;
