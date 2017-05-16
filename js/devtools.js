//Tab Screenshot!

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    var senderTab = sender.tab.id ;
    if (request.greeting == "getScreenshot" || request.greeting == "getScreenshotPartial") { 
        //var ts = request.ts;
        //sendResponse({farewell: "ready for screenshot"}); 
        //get tab active screenshot jpeg
        responseMsg = "screenshot";
        if(request.greeting == "getScreenshotPartial") responseMsg = "screenshotPartial";
        chrome.tabs.captureVisibleTab(null, {format : "png"}, function(data) { 
            
            chrome.tabs.sendMessage(senderTab, {greeting: responseMsg,/* ts: ts ,*/ data: data}, function(response) {
                //console.log(response.farewell);
            }); 
        }); 
    }
    else if (request.greeting == "getResizeWindowMax") {
        chrome.windows.getLastFocused({populate: false}, function(currentWindow) {
            chrome.windows.update(currentWindow.id, { state: "maximized" });
            
            sendResponse({farewell: "resizeWindowMax" });  
        });
    }
    else if (request.greeting == "getResizeWindow") { 
        var vp = request.vp; 
        var actualVp = request.actualVp; 
        chrome.windows.getLastFocused({populate: false}, function(currentWindow) {
            
            diffHeight = currentWindow.height - actualVp.height;
            diffWidth = currentWindow.width - actualVp.width;
            
            if(vp.width === undefined || vp.height === undefined ) {
                chrome.windows.update(currentWindow.id, { state: "maximized" });
            }
            else {
                chrome.windows.update(currentWindow.id, { top: 0 , left: 0 , width: vp.width + diffWidth , height:vp.height + diffHeight });
            }
            
            chrome.tabs.sendMessage(senderTab, {greeting: "resizeWindow", vp: vp }, function(response) {
                //console.log(response.farewell);
            }); 
        });
    }
    else if(request.greeting =="setCookies") {
        var myCookies = [];
        responseMsg = "cookiesUpdated";
        for (var z in request.cookies) {    
            chrome.cookies.set({ name: request.cookies[z].name, url: request.cookies[z].url , path: '/', value: request.cookies[z].value } ,function(newCookie){
                myCookies.push(newCookie);
            }); 
        } 
         
        chrome.tabs.sendMessage(senderTab, {greeting: responseMsg, cookies: myCookies }, function(response) {
            //console.log(response.farewell);
            //if (chrome.runtime.lastError) {
            //    return chrome.runtime.lastError;
            //}
        }); 
    }
    else if(request.greeting == "getCookies" || request.greeting =="getClearCookies" ) {
        var myCookies = [],
            acceptedCookies = ["_gsExtAction","_gsExtNewTestTitle","_gsExtTest","_gsExtTestAction","_gsExtTestSequence","_gsExtTestSequencePosition"],
            responseMsg = "cookies";
        //sendResponse({farewell: "cookies", cookies: str});  
        chrome.cookies.getAll({}, function(cookies) {
            for (var i in cookies) {  
                if( acceptedCookies.indexOf(cookies[i].name) >= 0 && request.domains.indexOf(cookies[i].domain) != -1 /*cookies[i].domain == request.domain */) {
                    myCookies.push(cookies[i]);
                }  
            } 
            if(request.greeting =="getClearCookies") {
                responseMsg = "clearCookies";
                for (var y in myCookies) {   
                    myCookies[y].value = "";    
                    for (var z in request.url) { 
                        chrome.cookies.remove({ name: myCookies[y].name, url: request.url[z]/*, value:""*/ } ,function() {});
                    }
                }
            }
            
            chrome.tabs.sendMessage(senderTab, {greeting: responseMsg, cookies: myCookies , sender: sender  }, function(response) {
                //console.log(response.farewell);
            }); 
        });
    }
    else if(request.greeting =="notify") {
        var obj = {};
        obj.type= (request.content.type !== undefined) ? request.content.type : 'basic';
        obj.title= request.content.title;
        obj.message= request.content.message ;
        obj.iconUrl= "http://www.google.com/favicon.ico";
        //obj.buttons = [{title:'View test in action'}];
        
        if(request.content.type !== undefined && request.content.type == "progress") {
            obj.progress = request.content.progress;    
        }
        
        chrome.notifications.create('_gsExtNotify', obj ,function( notificationId ){
            
        });
    }
   /* chrome.notifications.onButtonClicked.addListener(function(notId , btnId ){
        if(notId == '_gsExtNotify') {
         //   chrome.tabs.highlight();
        }
    });*/
  });

//Downloads
chrome.downloads.onDeterminingFilename.addListener(function(item, suggest) {
    var file = item.filename.toString();
    var fileX = item.filename.toString();
    var match = file.match(/^(testReport - )((S)(\d+)(T)(\d+)|(T)(\d+))( - )/g);
    var matchImg = fileX.match(/^(testReportImg - )((S)(\d+)(A)(\d+)(T)(\d+)|(A)(\d+)(T)(\d+)|(S)(\d+)(T)(\d+)|(T)(\d+))( - )/g);
    if(match !== undefined && match !== null && match[0]) {
        fileName = file.replace(match[0],"");
        Path = match[0];
        Path = Path.split(" - ");
        Path = Path[1];
        if( Path.charAt(0) == "S") {
            Path = Path.replace("T","/T");
        }
        Path = "gsExtReports/reports/" + Path + "/";
        
        chrome.downloads.setShelfEnabled(false);
        suggest({filename: Path + fileName}); 
    }
    else if(matchImg !== undefined && matchImg !== null && matchImg[0]) {
        Path = matchImg[0];
        Path = Path.split(" - ");
        Path = Path[1];
        if( Path.charAt(0) == "S") { //sat o st
            p = Path;
            p = p.split("A");
            if( p.length > 1 ) {
                Path = Path.split("A");
                // A1T0.png
                Path = "A"+Path[1];//+".png";
                fileName = Path+".png";
            }
            else {
                Path = Path.split("T");
                // T0.png
                Path = "T"+Path[1];//+".png";
                fileName = Path+".png";
            }
        }
        else if( Path.charAt(0) == "T") {
            // T1.png 
            fileName =  Path+".png";
        }
        else {
            // A1
            Path = Path.split("T");
            fileName =  Path[0]+".png";
        }
        Path = matchImg[0];
        Path = Path.split(" - ");
        Path = Path[1];
        if( Path.charAt(0) == "S") { //sat
            p = Path.split("A");
            p2 = Path.split("T");
            if( p.length > 1 ) {
                Path = p[0]+"/T"+p2[1];//S1T2
            }
            else {
                Path = Path.replace("T","/T");
            }
        }
        else if( Path.charAt(0) == "T") { //t
            // nulla
        }
        else { //ta
            Path = Path.split("T");
            Path = "T"+Path[1]; 
        }
        Path = "gsExtReports/reports/" + Path + "/";
        chrome.downloads.setShelfEnabled(false);
        suggest({filename: Path + fileName}); 
    }
    else {
        chrome.downloads.setShelfEnabled(true);
    }
     var obj = {};
    
    if(item.mime == "image/png") {
        obj.type= 'image';
        obj.title= "Screenshot available" ;
        obj.imageUrl=item.url  ;
        obj.message= item.url + " ---- " + item.filename  + " ---- " + item.referrer ;
        obj.iconUrl= "http://www.google.com/favicon.ico";
    }
    else if(item.mime == "text/html") {
        var obj = {};
        obj.type= 'basic';
        obj.title= "Report available " ;
        obj.message= item.filename ;
        //obj.message= item.url + " ---- " + item.filename  + " ---- " + item.referrer ;
        obj.iconUrl= "http://www.google.com/favicon.ico";
    } 
    
    chrome.notifications.create('_gsExtNotifyScreenshot'+item.id, obj ,function( notificationId ){
            
    });
    return true;
});
chrome.downloads.onCreated.addListener(function(item) {
   /*
    var obj = {};
    
    if(item.mime == "image/png") {
        obj.type= 'image';
        obj.title= "Screenshot available";
        obj.imageUrl= "http://www.google.com/favicon.ico";
        obj.message= item.url + " ---- " + item.filename  + " ---- " + item.referrer ;
        obj.iconUrl= "http://www.google.com/favicon.ico";
    }
    else if(item.mime == "text/html") {
        var obj = {};
        obj.type= 'basic';
        obj.title= "Report available";
        obj.message= item.url + " ---- " + item.filename  + " ---- " + item.referrer ;
        obj.iconUrl= "http://www.google.com/favicon.ico";
    } 
    
    chrome.notifications.create('_gsExtNotifyScreenshot'+item.id, obj ,function( notificationId ){
            
    });*/
});
chrome.downloads.onChanged.addListener(function(item) {
   
    var obj = {};
    
    if(item.mime == "image/png") {
        obj.type= 'image';
        obj.title= "Screenshot available"+item.state;
        obj.imageUrl= "http://www.google.com/favicon.ico";
        obj.message= item.url + " ---- " + item.filename  + " ---- " + item.referrer ;
        obj.iconUrl= "http://www.google.com/favicon.ico";
    }
    else if(item.mime == "text/html") {
        var obj = {};
        obj.type= 'basic';
        obj.title= "Report available "+item.state;
        obj.message= item.url + " ---- " + item.filename  + " ---- " + item.referrer ;
        obj.iconUrl= "http://www.google.com/favicon.ico";
    } 
    
    chrome.notifications.create('_gsExtNotifyScreenshot'+item.id, obj ,function( notificationId ){
            
    });
});