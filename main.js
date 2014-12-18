var path                    = "";
var getAffiliateDomainsLink = path + "getAffiliateList";
var eventLogLink            = path + "log";
var getIFrameLink           = path + "getAffiliateIframe?";


var offerListCompiledCallback = null;

var userID = null;

$(document).ready(function() {

    Publisher.init(function(offerData){

        var request = getIFrameLink;

        for(var offer  in offerData){
            request += "domain" + offer + "=" + offerData[offer].domain;
            request +="&";
        }

        //Add User ID
        request += "userID=" + userID;

        //Create IFrame
        var ifrm = document.createElement("IFRAME"); 
        ifrm.setAttribute("src", request); 
        ifrm.setAttribute('height', 138);
        ifrm.setAttribute('width', 658);
        ifrm.setAttribute("frameborder", 0);
        ifrm.setAttribute('id', 'affiliate-iframe');
        $(".mv-hide").prepend(ifrm);

    });

});

var Publisher = {

    getResources: function(e, t) {
        $.ajax({
            url: e,
            dataType: "json",
            success: function(e) {
                if (t != null) t(e)
            },
            failure: function(e) {
                 console.log("Failure get resources");
            }
        })
    },
    init: function(e) {

        offerListCompiledCallback = e;

        //Get user ID
        chrome.runtime.sendMessage({type: 'user'}, function(id){
            
            userID = id;
            Publisher.logLoad();
        });

        Publisher.getResources(getAffiliateDomainsLink, function(t) {
            Publisher.getHistory(t);

            return;
        });

    },
    getHistory: function(domains){

        //Send all domains at once, and returns 
        chrome.runtime.sendMessage({type: 'history', link: domains}, function(response){
            offerListCompiledCallback(response);
        });
      
    },
    logLoad: function(){

        var data        = {};
        data.userID     = userID;
        data.eventName  = 'loadAffiliateOffers';
        data.country    = '';
        HttpClient.post(eventLogLink,data,null);

      }
}

var HttpClient = {

    post : function(aUrl, data, aCallback) {
        anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function() { 
            if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200 && aCallback != null){
                aCallback(anHttpRequest.responseText);
            }
        }

        anHttpRequest.open("POST", aUrl, true );  
        anHttpRequest.setRequestHeader("Content-type","application/x-www-form-urlencoded");          
        anHttpRequest.send(HttpClient.serialize(data));
    },
    serialize : function(data) {
        if(data == null){
            return "";
        }

        var sData = "";
        Object.keys(data).forEach(function(key) {
            sData += (key + "=" + data[key] + "&");
        });

        return sData;
    }
}

