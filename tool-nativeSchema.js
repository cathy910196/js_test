/**
 * @author alanzhang
 * @date 2016-07-15
 * @overview ??�b??������?native App;
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

    // UA?�w
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

        // �D?
        HOME: "http://www.cocomen-iot.com/",

        // ?�_��??����??��
        FAILBACK: {
            ANDROID: "https://play.google.com/store/apps/details?id=com.bino.cocoma",
            IOS:"https://itunes.apple.com/tw/app/id1276132714"
        },

        // Android apk ��?�H��
        APK_INFO: {
            PKG: "com.bino.cocoma",
            CATEGORY: "android.intent.category.DEFAULT",
            ACTION: "android.intent.action.VIEW"
        },

        // ?�_�W???�A�W??��?��U??��
        LOAD_WAITING: 3000
    };

    var ua = window.navigator.userAgent;

    // �O�_?Android�U��chrome??���A�ư�mobileQQ�F
    // Android�U��chrome�A�ݭn�q?�S��intent ??��
    // refer link�Ghttps://developer.chrome.com/multidevice/android/intents
    var isAndroidChrome = (ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/))
                          && browser.isAndroid() && !browser.isMobileQQ();

    return {
        /**
         * [mixinConfig ���s��?�t�m]
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
         * [generateSchema ���u���P��?����UA�ͦ���??�Ϊ�schema]
         * @return {[type]}                [description]
         */
        generateSchema: function(schema) {

            var localUrl  = window.location.href;
            var schemaStr = '';

            // �p�G���w?schema�A?���u?�e��??�M�g
            if (!schema) {
                schemaStr = AppConfig.HOME;
                // �bschema�ٲ�?�A�i�H���u?�e?����url�A?�m���P���q?��
            } else {
                schemaStr = schema;
            }

            // �p�G�O�w��chrome??���A?�q?intent�覡��?
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
         * [loadSchema ?��native App�A�p�G?�k?���A?��?��U??]
         * @return {[type]} [description]
         */
        loadSchema: function(config){

            this.mixinConfig(config);

            var schemaUrl = this.generateSchema(AppConfig.schema);

            var iframe    = document.createElement("iframe"),
                aLink     = document.createElement("a"),
                body      = document.body,
                loadTimer = null;

            // ?��iframe��a
            aLink.style.cssText = iframe.style.cssText = "display:none;width:0px;height:0px;";

            // Android �L�H�����schema?���A��?���e�[�J??���զW?
            if (browser.isWx() && browser.isAndroid()) {

                window.location.href = AppConfig.FAILBACK.ANDROID;

            // ios 9 safari �����iframe���覡��?
            } else if (browser.isIOS()) {

                if (browser.isWx()) {
                    window.location.href = AppConfig.FAILBACK.IOS;
                } else {
                    aLink.href = schemaUrl;
                    body.appendChild(aLink);
                    aLink.click();
                }

            // Android chrome �����iframe �覡?��
            // ��ΡGchrome,leibao,mibrowser,opera,360
            } else if (isAndroidChrome) {

                aLink.href = schemaUrl;
                body.appendChild(aLink);
                aLink.click();

            // ��L??��
            // ��ΡGUC,sogou,firefox,mobileQQ
            } else {

                body.appendChild(iframe);
                iframe.src = schemaUrl;

            }

            // �p�GLOAD_WAITING??�Z,?�O?�k?��app�A?������?�U??
            // opera ?��
            var start = Date.now(),
                that  = this;
            loadTimer = setTimeout(function() {

                if (document.hidden || document.webkitHidden) {
                    return;
                }

                // �p�Gapp??�A??���̤p��?�J�Z�x�A???���s�b��?�Ϊ�?�C��??
                // ���\�N??��즹??�A???�j���M�j�_?�m���w???
                if (Date.now() - start > AppConfig.LOAD_WAITING + 200) {
                    // come back from app

                    // �p�G??�����]?app???�J�Z�x�A?�w?��?��??��A�G??��?��U??
                } else {
                    window.location.href = browser.isIOS() ? AppConfig.FAILBACK.IOS : AppConfig.FAILBACK.ANDROID;
                }

            }, AppConfig.LOAD_WAITING);


            // ?���aapp�Q?�_�A??��??�ñ��A�N?�D?pagehide�Ovisibilitychange�ƥ�
            // �b����??�����i��A�I�W���Ѥ�סA�@hack?�z
            var visibilitychange = function() {
                var tag = document.hidden || document.webkitHidden;
                tag && clearTimeout(loadTimer);
            };
            document.addEventListener('visibilitychange', visibilitychange, false);
            document.addEventListener('webkitvisibilitychange', visibilitychange, false);
            // pagehide ��??�w��window
            window.addEventListener('pagehide', function() {
                clearTimeout(loadTimer);
            }, false);
        }
    };
}));