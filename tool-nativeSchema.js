/**
 * @author alanzhang
 * @date 2016-07-15
 * @overview ??在??器中打?native App;
 *
 */

(function(root, factory){
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS-like
        module.exports = factory();
    } else {
        root.nativeSchema = factory();
    }
}(this, function(){

    // UA?定
    var browser = {
        isAndroid: function() {
            return navigator.userAgent.match(/Android/i) ? true : false;
        },
        isMobileQQ : function(){
            var ua = navigator.userAgent;
            return /(iPad|iPhone|iPod).*? (IPad)?QQ\/([\d\.]+)/.test(ua) || /\bV1_AND_SQI?_([\d\.]+)(.*? QQ\/([\d\.]+))?/.test(ua);
        },
        isIOS: function() {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i) ? true : false;
        },
        isWx : function() {
            return navigator.userAgent.match(/micromessenger/i) ? true : false;
        }
    };

    var AppConfig = {

        // ???
        PROTOCAL:"cocomen",

        // 主?
        HOME: "http://www.cocomen-iot.com/",

        // ?起失??的跳??接
        FAILBACK: {
            ANDROID: "https://play.google.com/store/apps/details?id=com.bino.cocoma",
            IOS:"https://itunes.apple.com/tw/app/id1276132714"
        },

        // Android apk 相?信息
        APK_INFO: {
            PKG: "com.bino.cocoma",
            CATEGORY: "android.intent.category.DEFAULT",
            ACTION: "android.intent.action.VIEW"
        },

        // ?起超???，超??跳?到下??面
        LOAD_WAITING: 3000
    };

    var ua = window.navigator.userAgent;

    // 是否?Android下的chrome??器，排除mobileQQ；
    // Android下的chrome，需要通?特殊的intent ??醒
    // refer link：https://developer.chrome.com/multidevice/android/intents
    var isAndroidChrome = (ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/))
                          && browser.isAndroid() && !browser.isMobileQQ();

    return {
        /**
         * [mixinConfig 重新收?配置]
         * @param  {[type]} config [description]
         * @return {[type]}        [description]
         */
        mixinConfig: function(config){
            if (!config) {
                return;
            }

            AppConfig.PROTOCAL = config.protocal || AppConfig.PROTOCAL;
            AppConfig.schema   = config.schema || AppConfig.HOME;
            AppConfig.LOAD_WAITING = config.loadWaiting || AppConfig.LOAD_WAITING ;

            if (browser.isIOS()) {
                AppConfig.FAILBACK.IOS = config.failUrl || AppConfig.FAILBACK.IOS;
            } else if (browser.isAndroid()) {
                AppConfig.FAILBACK.ANDROID = config.failUrl || AppConfig.FAILBACK.ANDROID;
                AppConfig.APK_INFO = config.apkInfo || AppConfig.APK_INFO;
            }

        },
        /**
         * [generateSchema 根据不同的?景及UA生成最??用的schema]
         * @return {[type]}                [description]
         */
        generateSchema: function(schema) {

            var localUrl  = window.location.href;
            var schemaStr = '';

            // 如果未定?schema，?根据?前路??映射
            if (!schema) {
                schemaStr = AppConfig.HOME;
                // 在schema省略?，可以根据?前?面的url，?置不同的默?值
            } else {
                schemaStr = schema;
            }

            // 如果是安卓chrome??器，?通?intent方式打?
            if (isAndroidChrome) {
                schemaStr =  "intent://" + schemaStr +"#Intent;"  +
                             "scheme="   + AppConfig.PROTOCAL          + ";"+
                             "package="  + AppConfig.APK_INFO.PKG      + ";"+
                             "category=" + AppConfig.APK_INFO.CATEGORY + ";"+
                             "action="   + AppConfig.APK_INFO.ACTION   + ";"+
                             "S.browser_fallback_url=" + encodeURIComponent(AppConfig.FAILBACK.ANDROID) + ";" +
                             "end";
            } else {
                schemaStr = AppConfig.PROTOCAL + "://" + schemaStr;
            }

            return schemaStr;
        },

        /**
         * [loadSchema ?醒native App，如果?法?醒，?跳?到下??]
         * @return {[type]} [description]
         */
        loadSchema: function(config){

            this.mixinConfig(config);

            var schemaUrl = this.generateSchema(AppConfig.schema);

            var iframe    = document.createElement("iframe"),
                aLink     = document.createElement("a"),
                body      = document.body,
                loadTimer = null;

            // ?藏iframe及a
            aLink.style.cssText = iframe.style.cssText = "display:none;width:0px;height:0px;";

            // Android 微信不支持schema?醒，必?提前加入??的白名?
            if (browser.isWx() && browser.isAndroid()) {

                window.location.href = AppConfig.FAILBACK.ANDROID;

            // ios 9 safari 不支持iframe的方式跳?
            } else if (browser.isIOS()) {

                if (browser.isWx()) {
                    window.location.href = AppConfig.FAILBACK.IOS;
                } else {
                    aLink.href = schemaUrl;
                    body.appendChild(aLink);
                    aLink.click();
                }

            // Android chrome 不支持iframe 方式?醒
            // 适用：chrome,leibao,mibrowser,opera,360
            } else if (isAndroidChrome) {

                aLink.href = schemaUrl;
                body.appendChild(aLink);
                aLink.click();

            // 其他??器
            // 适用：UC,sogou,firefox,mobileQQ
            } else {

                body.appendChild(iframe);
                iframe.src = schemaUrl;

            }

            // 如果LOAD_WAITING??后,?是?法?醒app，?直接打?下??
            // opera ?效
            var start = Date.now(),
                that  = this;
            loadTimer = setTimeout(function() {

                if (document.hidden || document.webkitHidden) {
                    return;
                }

                // 如果app??，??器最小化?入后台，???器存在推?或者?慢的??
                // 那么代??行到此??，???隔必然大于?置的定???
                if (Date.now() - start > AppConfig.LOAD_WAITING + 200) {
                    // come back from app

                    // 如果??器未因?app???入后台，?定?器?准??行，故??跳?到下??
                } else {
                    window.location.href = browser.isIOS() ? AppConfig.FAILBACK.IOS : AppConfig.FAILBACK.ANDROID;
                }

            }, AppConfig.LOAD_WAITING);


            // ?本地app被?起，??面??藏掉，就?触?pagehide与visibilitychange事件
            // 在部分??器中可行，网上提供方案，作hack?理
            var visibilitychange = function() {
                var tag = document.hidden || document.webkitHidden;
                tag && clearTimeout(loadTimer);
            };
            document.addEventListener('visibilitychange', visibilitychange, false);
            document.addEventListener('webkitvisibilitychange', visibilitychange, false);
            // pagehide 必??定到window
            window.addEventListener('pagehide', function() {
                clearTimeout(loadTimer);
            }, false);
        }
    };
}));