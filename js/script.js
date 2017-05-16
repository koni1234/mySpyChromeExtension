var gsExt = function() {
        
    var action = "index", 
        idSequence = null , //index tests sequence in esecuzione
        idTest = null ,     //index test in esecuzione
        idAction = null ,   //index action del test in esecuzione
        currentSequencePos = null , //index blocco della test sequence in esecuzione
        timer = null,       //usato x sbloccare situzioni di mancata risposta chrome a active tab
        newTestTemp = {},
        hostNamesMatchList = [ //TODO magari usare storage x salvare "siti web" cioe unire cookie tra piu domini http / https 
            {"www.valentino.com": [
                "https://www.valentino.com",
                "https://valentino.com",
                "http://www.valentino.com",
                "https://secure.store.valentino.com",
            ]},
            {"www.redvalentino.com": [
                "http://www.redvalentino.com",
                "https://secure.store.redvalentino.com",
            ]}/*,
            {"secure.store.valentino.com": [
                "https://secure.store.valentino.com",
                "http://www.valentino.com"
            ]}*/
        ],
        target = {} ,
        templates = {
            index: {
                title:'Gamestorm Extension',
                content: '<ul><li><span>Run</span><button id="_gsExtRunTest">Test</button>'+
                '<button id="_gsExtRunSequence">Sequence</button></li>'+
                '<li><span>Create</span><button id="_gsExtNewTest">New Test</button>'+ 
                '<button id="_gsExtNewSequence">New Tests Sequence</button></li>'+
                '<li><span>Archive</span><button id="_gsExtRunTestDownload" >Export Test list</button>'+
                '<button id="_gsExtRunTestUpload" >Import Test list</button>'+
                '<button id="_gsExtRunTestClear" >Clear Test list</button></li></ul>'+
                '<button id="_gsExtArchive" >History</button>'+
                '<button id="_gsExtSettings" >Settings</button>'+
                '<button class="effeckt-modal-close">Exit</button>'
            },
            editSettings: {
                title: 'Edit settings',  
                content:'<span class="_gsExtError"></span><label>Local extension path:</label><input type="text" name="_gsExtLocalPath" id="_gsExtLocalPath" placeholder="file:///C:/myFolder" ><label>Attiva notifiche:</label><select id="_gsExtNotifications"><option value="true" selected>Si</option><option value="false">No</option></select><button class="effeckt-modal-close" id="_gsExtSaveSettings">Salva</button><button id="_gsExtNewBack">Torna indietro</button>'
            },
            resumeNewTest: {
                title:'Resume new test',
                content:'<button id="_gsExtNewTestResume" class="effeckt-modal-close">Continua creazione</button>'+
                '<button id="_gsExtNewBack">Torna indietro</button>'+ 
                '<button class="effeckt-modal-close">Exit</button>'
            },
            selectTest: {
                title: 'Seleziona un test da eseguire',  
                content:'<select id="_gsExtTestList"></select><select id="_gsExtTestViewport"></select><button id="_gsExtRunTestStart" class="effeckt-modal-close">Run Test</button><button id="_gsExtNewBack">Torna indietro</button>'
            },
            selectTestSequence: {
                title: 'Seleziona una tests sequence da eseguire',  
                content:'<select id="_gsExtTestSequenceList"></select><select id="_gsExtTestViewport"></select><div id="_gsExtTests"></div><button id="_gsExtRunSequenceStart" class="effeckt-modal-close">Run Tests</button><button id="_gsExtNewBack">Torna indietro</button>'
            },
            importList: {
                title: 'Import json test list as txt',  
                content:'<textarea id="_gsExtTestImportList"></textarea><span></span><button id="_gsExtUpload">Import Test</button><button id="_gsExtNewBack">Torna indietro</button>'
            },
            newSequence: {
                title: 'Aggiungi una nuova sequenza di test',   
                content:'<p>bla bla bla.</p><span class="_gsExtError"></span><label>Titolo:</label><input type="text" name="_gsExtTestTitle" id="_gsExtTestTitle" ><label>Seleziona i test da eseguire:</label><select id="_gsExtTestList"><option value="">-- Seleziona --</option></select> <button id="_gsExtAddTest">Aggiungi test</button> <ol id="_gsExtSelectedTests"></ol> <button disabled class="effeckt-modal-close" id="_gsExtSaveSequence">Salva</button><button id="_gsExtNewBack">Torna indietro</button>'
            },
            newTest: {
                title: 'New test',  
                content:'<span class="_gsExtError"></span><label>Titolo:</label><input type="text" name="_gsExtTestTitle" id="_gsExtTestTitle" ><label>Pagina di partenza:</label><input type="text" disabled name="_gsExtTestUrl" id="_gsExtTestUrl" value="'+window.location.href+'"><button disabled class="effeckt-modal-close" id="_gsExtNewTestStart">Procedi</button><button id="_gsExtNewBack">Torna indietro</button>'
            },
            addAction: {   
                title: 'Add action',
                content:'<span class="_gsExtError"></span><label>Titolo azione: </label><input type="text" name="_gsExtTestTitle" id="_gsExtTestTitle" >'+ 
                '<label>Elemento selezionato:</label><div id="_gsExtTestTargets"><span><b>Tag:</b> ||target.tagName||</span><span><b>Type:</b> ||target.type|| </span><span><b>Id:</b> ||target.id|| </span><span><b>name:</b> ||target.name|| </span><span><b>href:</b> ||target.href|| </span><span><b>ClassName:</b> ||target.className|| </span><span><b>Text:</b> ||target.textContent|| </span><span><b>All attributes:</b> ||target.attributes|| </span><p><span><b>Match string:</b> ||target.matchString||</span></p><span><b>DOM Parents tree:</b> <ul class="targetParents">||target.parents||</ul></span></div>'+
                '<label>Modifica query string:</label><div id="_gsExtTextEditQuery"><input type="text" > <span></span></div>'+
                '<label>Azione: </label><div id="_gsExtTestActions"><select></select></div>'+
                '<div id="_gsExtTestOptions"><label>Verifica azione dopo: </label><input type="number" name="_gsExtTestSleep" id="_gsExtTestSleep" value="1"> secondi <label>Scroll sull\'elemento: </label><select name="_gsExtTestScroll" id="_gsExtTestScroll" ><option value="false">no</option><option value="true">si</option></select></select> <label>Esegui screenshot: </label><select name="_gsExtTestScreenshot" id="_gsExtTestScreenshot" ><option value="false">no</option><option value="true">si</option></select> <label>Check url (<i id="checkUrl"></i>): </label><select name="_gsExtTestActionUrl" id="_gsExtTestActionUrl" ><option value="false">no</option><option value="true">si</option></select></div>'+
                '<button disabled class="effeckt-modal-close" id="_gsExtAddAction">Salva e procedi con una nuova azione</button>'+
                '<button disabled class="effeckt-modal-close" id="_gsExtSaveTest">Salva azione e termina il test</button>'+ 
                '<button class="effeckt-modal-close">Annulla azione</button><button id="_gsExtNewBack">Annulla test</button>'
            },
            report: {
                header : "<html><head><title>Report page</title><link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/foundation/6.2.3/foundation.min.css\"><script src=\"https://use.fontawesome.com/51d1167823.js\"></script></head><body style=\"background:#333;\"><div class=\"callout\"><h3>Test run - report</h3><div><h5>||test.title||</h5></div>",
                content : "", 
                footer : "</div><script type=\"text/javascript\" src=\"https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js\"></script><script type=\"text/javascript\" src=\"https://cdnjs.cloudflare.com/ajax/libs/foundation/6.2.3/foundation.min.js\"></script><script> new Foundation.Accordion($('.accordion'));</script></body></html>"
            }
        },
        actionsEvent = ['click','is visible','text comparation'],
        customScrollbars = ['none','auto detect','nicescroll','jscrollpane'],
        validations = {
            title: function(v){ 
                if(v.match(/\w{3}/g)) return true;
            },
            url: function(v){
                if(v.match(/(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/g)) return true;
            }
        };
        
    var detectTarget = function (e) {
            target.target = e.target;
            target.parentsTargets = $(e.target).parentsUntil('body');
            target.tagName = e.target.tagName;
            target.type = e.target.type;
            target.id = e.target.id;
            target.href = e.target.href;
            target.attributes="";
             
            $.each(e.target.attributes, function( k, v ){
                target.attributes += v.name + '="' + v.value + '" ';
            });
            target.name = e.target.name !== undefined ? e.target.name : '';
            target.className = e.target.className.replace('outline-element','');
            target.textContent = e.target.textContent;//.substr(0,10);
            
            var match = checkTargetTracking(e);
            target.matchString = match[0];
            target.totMatch = match[1];
            
            console.info(target);
            if(action=="addAction") {
                
                if(target.totMatch > 1 ) {
                    _modal.placeholders('addAction');
                }
                else {
                    _modal.placeholders('addAction');
                }
            }
        },
        
        findTarget = function(element , totMatch , matchString ) {
           id = element.id,
               className = element.className !== undefined ? element.className : '',  
                href = element.href !== undefined ? element.href : '',  
                name = element.name !== undefined ? element.name : '',   
                type = element.type !== undefined ? element.type : '', 
                tagName = element.tagName,
                attributes = element.attributes,
                l = '',
                retMatchString=""; 
            
            className = className.replace('outline-element','').trim();
            //splitto className x " " per pulire stringa da stranezze 
            listClass = className.split(" ");
            className = "";
            for(i in listClass) {
                if(listClass[i]) {
                    className += "."+listClass[i].replace(".",""); 
                }
            }
            
            if( typeof totMatch == "undefined" ) totMatch = 0;
            if( typeof matchString == "undefined") matchString = "";
            totMatch = parseInt(totMatch);
            retMatchString = matchString.trim();
            
            
            //1 check id
            if(( totMatch > 1 || totMatch<1) && id && $(tagName+'#'+id).length ) {
                if(matchString) {
                    l = $(tagName+'#'+id).find(matchString).filter(':visible').length;
                }
                else {
                    l = $(tagName+'#'+id).filter(':visible').length;
                }
                if(l >0 && ( l < totMatch || totMatch<1) ) {
                    totMatch = l;
                    retMatchString = tagName+"#"+id+" "+matchString;
                }
            }
            //2 check class
            if(( totMatch > 1 || totMatch<1) && className && $(tagName+''+className).length ) {
                if(matchString) {
                    l = $(tagName+''+className).find(matchString).filter(':visible').length;
                }
                else {
                    l = $(tagName+''+className).filter(':visible').length; 
                }
                if(l >0 && ( l < totMatch || totMatch<1) ) {
                    totMatch = l;
                    retMatchString = tagName+""+className + " " +matchString;
                }
            }
            //3 check x tag puro -- lo limito solo a primo target ( no a parents retMatchString == "" )
            if(( totMatch > 1 || totMatch<1) && $(tagName).length && retMatchString=="") {
                if(matchString) {
                    l = $(tagName).find(matchString).filter(':visible').length; 
                }
                else {
                    l = $(tagName).filter(':visible').length; 
                }
                if(l >0 && ( l < totMatch || totMatch<1) ) {
                    retMatchString = tagName+" "+matchString;
                    totMatch = l;
                }
            } 
            //4 check attr name 
            if(( totMatch > 1 || totMatch<1) && name && $(tagName+'[name="'+name+'"]').length ) {
                if(matchString) {
                    l = $(tagName+'[name="'+name+'"]').find(matchString).filter(':visible').length; 
                }
                else {
                    l = $(tagName+'[name="'+name+'"]').filter(':visible').length; 
                }
                if(l >0 && ( l < totMatch || totMatch<1) ) {
                    retMatchString = tagName+"[name='"+name+"'] "+" "+matchString;
                    totMatch = l;
                }
            } 
            //5 check attr name + class
            if(( totMatch > 1 || totMatch<1) && name && className && $(tagName+'[name="'+name+'"]'+className).length ) {
                if(matchString) {
                    l = $(tagName+'[name="'+name+'"]'+className).find(matchString).filter(':visible').length; 
                }
                else {
                    l = $(tagName+'[name="'+name+'"]'+className).filter(':visible').length; 
                }
                if(l >0 && ( l < totMatch || totMatch<1) ) {
                    totMatch = l;
                    retMatchString = tagName+"[name='"+name+"']"+className+" "+matchString;
                }
            }
            //6 check attr href + className
            if(( totMatch > 1 || totMatch<1) && href && className && $(tagName+'[href="'+href+'"]'+className).length ) {
                if(matchString) {
                    l = $(tagName+'[href="'+href+'"]'+className).find(matchString).filter(':visible').length; 
                }
                else {
                    l = $(tagName+'[href="'+href+'"]'+className).filter(':visible').length; 
                }
                if(l >0 && ( l < totMatch || totMatch<1) ) {
                    totMatch = l;
                    retMatchString = tagName+"[href='"+href+"']"+className+" "+matchString;
                }
            }
            //7 check attr href
            if(( totMatch > 1 || totMatch<1) && href && !className && $(tagName+'[href="'+href+'"]').length ) {
                if(matchString) {
                    l = $(tagName+'[href="'+href+'"]').find(matchString).filter(':visible').length; 
                }
                else {
                    l = $(tagName+'[href="'+href+'"]').filter(':visible').length; 
                }
                if(l >0 && ( l < totMatch || totMatch<1) ) {
                    retMatchString = tagName+"[href='"+href+"'] "+" "+matchString;
                    totMatch = l;
                }
            } 
            //8check altri data attributes...
            if(( totMatch > 1 || totMatch<1 ) && attributes.length ) {
                $.each(attributes, function( k, v ){
                    if(( totMatch > 1 || totMatch<1) && v.name != "style" && v.name != "target" && v.name != "class" && v.name!="href" && v.name!="name") { 
                        if(v.value.length > 20 ) {
                            dataTagName='['+v.name+']';
                        }
                        else {
                            dataTagName='['+v.name+'="'+v.value.replace(/"/g, "&quot;")+'"]';
                        }
                        if(matchString) {
                            l = $(tagName+dataTagName).find(matchString).filter(':visible').length; 
                        }
                        else {
                            l = $(tagName+dataTagName).filter(':visible').length; 
                        }
                        if(l >0 && ( l < totMatch || totMatch<1) ) {
                            retMatchString = tagName+dataTagName+" "+matchString;
                            totMatch = l;
                        } 
                    } 
                });  
            } 
            
            return [retMatchString,totMatch];
        },
        
        checkTargetTracking = function(e) {
            //color bg bar red / yellow / green
            var totMatch = 0,
                matchString ="",
                elm ="";
            
            if(target.matchString && target.totMatch && target.totMatch>1) {
                //
            }
            else {
                var res =  findTarget(e.target);
                totMatch = res[1];
                matchString = res[0]; 
                //console.info("F"+totMatch + "=" +matchString);
                if(totMatch > 1) {
                    //verificare parent x fare detect automatico migliore (trovo id classi data attr )
                    elm = $(e.target); 
                    $.each( elm.parentsUntil('body') , function(){ 
                        if( totMatch > 1 /* || ( this.tagName == "FORM" && totMatch >= 1 )*/) { 
                            res =  findTarget( this ,totMatch,matchString);
                            totMatch = res[1];
                            matchString = res[0];  
                        } 
                    });
                }
            }
            
            console.info(matchString + " ("+totMatch+")");
            
            if (totMatch == 1) {
                //ok
                _bottomBar.target.css('background-color','green'); 
            }
            else if (totMatch > 1 ) {
                //ok
                _bottomBar.target.css('background-color','orange'); 
            }
            else if (totMatch == 0 ) {
                //ok
                _bottomBar.target.css('background-color','red'); 
            }
            else {
                _bottomBar.target.css('background-color','');
            }
            return [matchString,totMatch];
        },
        
        //bottom bar obj
        
        _bottomBar = {
            
            target: null ,
            init: function() {
                
                $('._gsExtBottomBar').remove(); 
                $('body').append('<div class="_gsExtBottomBar" ></div>'); 
                _bottomBar.target = $('._gsExtBottomBar');  
            },
            update: function(e) {
                var recap = '';
                if((action=="addAction") && _modal.isOpen === false ) {
                    
                    //migliorabile questa fn potrebbe stare altrove    
                    checkTargetTracking(e);
                    //da aggiornare migliorare ecc
                    
                    recap += (e.target.tagName!== undefined && e.target.tagName!== '') ? '<span><b>Tag:</b> ' + e.target.tagName + '</span>' : '';
                    recap += (e.target.id!== undefined && e.target.id!== '') ? '<span><b>Id:</b> ' + e.target.id + '</span>' : '';
                    recap += (e.target.name!== undefined && e.target.name!== '') ? '<span><b>name:</b> ' + e.target.name + '</span>' : '';
                    recap += (e.target.href!== undefined && e.target.href!== '') ? '<span><b>href:</b> ' + e.target.href + '</span>' : '';
                    recap += (e.target.type!== undefined && e.target.type!== '') ? '<span><b>type:</b> ' + e.target.type + '</span>' : '';
                    recap += (e.target.className!== undefined && e.target.className!== '') ? '<span><b>className:</b> ' + e.target.className + '</span>' : '';
                    recap += (e.target.textContent!== undefined && e.target.textContent!== '') ? '<span><b>text:</b> ' + e.target.textContent.substr(0,10) + '</span>' : '';
                    
                    _bottomBar.target.html( recap );

                }
            },
            show: function() {
                
                _bottomBar.target.fadeIn();
            },
            hide: function() {
                
                if(_bottomBar.target !== null) _bottomBar.target.fadeOut();
            }
        },
        
        //obj modal popup
        
        _modal = {
            isOpen: false,
            wrap: null,
            init: function() {
                
                $('body').append('<div class="effeckt-wrap effeckt-modal-wrap " data-template="" id="effeckt-modal-wrap"><div class="effeckt-content effeckt-modal" id="effeckt-modal"><h3>Aggiungi un azione</h3><div class="effeckt-modal-content"><p>This is a modal window.</p><button class="effeckt-modal-close">Close me!</button></div></div></div>');
                _modal.wrap = $('#effeckt-modal-wrap');
                _modal.set('index');
            },
            set: function(template) { 
                
                _modal.wrap.find('#effeckt-modal > h3').html(templates[template].title);
                _modal.wrap.find('.effeckt-modal-content').html(templates[template].content);
                _modal.wrap.data('template',template); 
                _modal.wrap.attr('data-template',template); 
                _modal.placeholders(template);
            },
            placeholders: function(template) { 
                
                if(template == 'index') {
                    if(_settings.list.localPath) {
                        _modal.wrap.find('#_gsExtArchive').show();
                    }
                    else {
                        _modal.wrap.find('#_gsExtArchive').hide();
                    }
                }
                if(template == 'selectTest') {  
                    //popolo lista test 
                    $.each(_savedTestList.list,function(){
                        var t = this;
                        var domain = utils.getDomain(t.url);
                    
                        _modal.wrap.find('#_gsExtTestList').append( $('<option data-url="'+domain+'"></option>').val(_savedTestList.list.indexOf(t)).html(t.title) );
                    });
                    
                    //lista viewports
                    $.each(_resizer.viewports,function(k,v){  
                        _modal.wrap.find('#_gsExtTestViewport').append( $('<option></option>').val(k).html(k) );
                    });
                    
                    //riordio lista x url
                    var options = _modal.wrap.find('#_gsExtTestList option');
                    var arr = options.map(function(_, o) { return { t: $(o).text(), v: o.value , u: $(o).attr('data-url') }; }).get();
                    arr.sort(function(o1, o2) { return o1.u > o2.u ? 1 : o1.u < o2.u ? -1 : 0; });
                    options.each(function(i, o) {
                        o.value = arr[i].v;
                        $(o).text(arr[i].t);
                        $(o).attr('data-url',arr[i].u);
                        
                        if (!$(o).closest('select').find('optgroup[label="' + arr[i].u + '"]').length) {
                            $('<optgroup />', { 'label' : arr[i].u }).appendTo($(o).closest('select'));
                        }
                        
                        $(o).appendTo($(o).closest('select').find('optgroup[label="' + arr[i].u + '"]'));
                    });
                }
                if(template == 'selectTestSequence') {  
                    $.each(_savedTestList.sequencesList,function(){
                        var t = this;
                        _modal.wrap.find('#_gsExtTestSequenceList').append( $('<option></option>').val(_savedTestList.sequencesList.indexOf(t)).html(t.title) );
                    });
                    $.each(_resizer.viewports,function(k,v){  
                        _modal.wrap.find('#_gsExtTestViewport').append( $('<option></option>').val(k).html(k) );
                    }); 
                    
                    tests = _savedTestList.sequencesList[$('#_gsExtTestSequenceList').val()].tests;
                    str="<ol id='_gsExtSelectedTests'>";
                    $.each(tests, function( v , k ) {
                        str += "<li>"+_savedTestList.list[k].title + " <small>"+utils.getDomain(_savedTestList.list[k].url) + "</small></li>";
                    });
                    str+="</ol>";
                    $('#_gsExtTests').html(str); 
                }
                if(template == 'editSettings') {
                    $('#_gsExtLocalPath').val(_settings.list.localPath); 
                    if(_settings.list.notifications) {
                        $('#_gsExtNotifications').val(_settings.list.notifications); 
                    }
                }
                
                if(template == 'newSequence') {  
                    $.each(_savedTestList.list,function(){
                        var t = this;
                        _modal.wrap.find('#_gsExtTestList').append( $('<option></option>').val(_savedTestList.list.indexOf(t)).html(t.title) );
                    }); 
                }
                if(template == 'addAction') {
                    //target info
                    text = _modal.wrap.find('#_gsExtTestTargets').html(); 
                    text = text.replace('||target.tagName||',target.tagName);
                    text = text.replace('||target.id||',target.id);
                    text = text.replace('||target.type||',target.type);
                    text = text.replace('||target.href||',target.href);
                    text = text.replace('||target.name||',target.name);
                    text = text.replace('||target.className||',target.className);
                    text = text.replace('||target.attributes||',target.attributes);
                    text = text.replace('outline-element',""); 
                    text = text.replace('||target.textContent||',target.textContent); 
                    text = text.replace('||target.matchString||',target.matchString); 

                    i = 0  , tempTxt = "";

                    if (target.parentsTargets !== undefined) {
                        while(target.parentsTargets[i]/* && i <3*/){
                            tempTxt += '<li>'+target.parentsTargets[i].tagName + " ";

                            $.each(target.parentsTargets[i].attributes, function( k, v ){
                                tempTxt += v.name + '="' + v.value + '" ';
                            });
                            tempTxt += "</li>";

                            i++;
                        }
                    }

                    text = text.replace('||target.parents||',tempTxt);

                    _modal.wrap.find('#_gsExtTestTargets').html(text); 
                    _modal.wrap.find('#checkUrl').html(window.location.href);
                    //edit query string 
                    _modal.wrap.find('#_gsExtTextEditQuery > input').val( target.matchString ); 
                    //menu tendina
                    _modal.wrap.find('#_gsExtTestTitle').val('');
                    _modal.wrap.find('#_gsExtTestActions > select').empty();
                    $.each(actionsEvent, function(k,v) {
                        _modal.wrap.find('#_gsExtTestActions > select').append( $('<option></option>').val(v).html(v) );
                    }); 
                    //in base a tagName posso aggiungere altre azioni
                    if(target.tagName == "SELECT" || target.type == "radio"){
                        v='select';
                        _modal.wrap.find('#_gsExtTestActions > select').append( $('<option></option>').val(v).html(v) );
                    }
                    if(target.tagName == "CHECKBOX"){
                        v='check';
                        _modal.wrap.find('#_gsExtTestActions > select').append( $('<option></option>').val(v).html(v) );
                        v='uncheck';
                        _modal.wrap.find('#_gsExtTestActions > select').append( $('<option></option>').val(v).html(v) );
                    }
                    if(target.tagName == "TEXTAREA" || (target.tagName == "INPUT" && ( target.type == "text" || target.type == "password"|| target.type == "email"|| target.type == "tel"))){
                        v='write';
                        _modal.wrap.find('#_gsExtTestActions > select').append( $('<option></option>').val(v).html(v) );
                    } 
                    $('#_gsExtTextEditQuery input').trigger('keyup');
                }
            },
            open: function(action) { 
                if(action === undefined || action == "") {
                    action = 'index';
                } 
                _modal.set(action);
                _modal.wrap.addClass('slide-in-top effeckt-show');
                $('<div class="effeckt-overlay effeckt-modal-overlay" id="effeckt-modal-overlay" data-effeckt-dismiss="modal"></div>').insertAfter(_modal.wrap); 
                _modal.isOpen= true; 
                
                //trick
                $.each($('body').children(),function(){
                    if($(this).attr('id') != "effeckt-modal-wrap" && $(this).attr('id') != "effeckt-modal-overlay") {
                        $(this).css('visibility','hidden');
                    } 
                });
            },
            close: function() {
                _modal.isOpen = false; 
                _modal.wrap.removeClass('slide-in-top effeckt-show');
                $('#effeckt-modal-overlay').remove();
                
                //untrick
                $.each($('body').children(),function(){
                    if($(this).attr('id') != "effeckt-modal-wrap" && $(this).attr('id') != "effeckt-modal-overlay") {
                        $(this).css('visibility','');
                    } 
                });
            }
        },
        
        utils = {
            cloneObj: function(obj) {
                if (null == obj || "object" != typeof obj) return obj;
                var copy = obj.constructor();
                for (var attr in obj) {
                    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
                }
                return copy;
            },
            randomStr: function() {
                var chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
                var string = '';
                for(var ii=0; ii<8; ii++){
                    string += chars[Math.floor(Math.random() * chars.length)];
                } 
                return string;
            },
            randomMail: function() {
                var chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
                var string = '';
                for(var ii=0; ii<15; ii++){
                    string += chars[Math.floor(Math.random() * chars.length)];
                }
                string += '@domain.com';
                return string;
            },
            getDomain: function(url) {
                var domain;
                
                if (url.indexOf("://") > -1) {
                    domain = url.split('/')[2];
                }
                else {
                    domain = url.split('/')[0];
                }

                //find & remove port number
                domain = domain.split(':')[0];
                return domain;
            }
        },
        
        // ojb notification
        
        _notify = {
            /*var obj = {
  type: "basic",
  imageUrl: "url_to_preview_image"
  type: "list",
              type: "progress",
              title: "Primary Title",
              message: "Primary message to display",
              iconUrl: "url_to_small_icon",
              progress: 42
  items: [{ title: "Item1", message: "This is item 1."},
          { title: "Item2", message: "This is item 2."},
          { title: "Item3", message: "This is item 3."}]
            }*/
            sendRequest: function( obj ) {
                //obj.title e obj.message type progress
                chrome.runtime.sendMessage({ greeting: "notify" , content: obj }, function(response) {
                    //console.log(response.farewell); 
                });  
            } 
        },
        
        // obj repor test
        
        _report = {
            data: {
                header : "",
                content : "", 
                footer : "",
                recap : null,
                images : []
            }, 
            set: function(template) { 
                _report.data.header = templates[template].header;
                _report.data.content = templates[template].content;
                _report.data.footer = templates[template].footer;
                if(typeof (_report.data.recap) != "object") {
                    _report.data.recap = {};
                }
                _report.data.images = [];
                _report.data.header = _report.data.header.replace('||test.title||',_runTest.test.title);  
                _report.saveTemp();
            },
            updateImages: function(name, img) {
                if(name !== undefined && img !== undefined) { 
                    _report.data.images.push ({name:name,img:img});
                }
            },
            updateRecap: function() {
                _report.saveTemp();
            },
            update: function(str) {
                if(str !== undefined) { 
                    _report.data.content += str; 
                    _report.saveTemp();
                }
            },
            saveTemp: function() {
                var key = "reportTemp",
                    testPrefs = JSON.stringify(_report.data);
                var jsonfile = {};
                jsonfile[key] = testPrefs;
                chrome.storage.local.set(jsonfile, function () {
                    //console.log('Saved', key, testPrefs);
                });
            },
            downloadImage: function(i) {
                var image = _report.data.images[i],
                    titleImg = "testReportImg - ";
                
                if(image !== undefined) {
                    titleImg += image.name; 
                    var canvas = document.createElement('canvas');
                    var img = new Image();
                    img.onload = function() {
                        canvas.width = $(window).width();
                        canvas.height = $(window).height()
                        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

                        var $canvas = $(canvas);
                        $canvas.data('scrollLeft', $(document.body).scrollLeft());
                        $canvas.data('scrollTop', $(document.body).scrollTop());

                        // Perform callback after image loads 
                        canvas.toBlob( function(blob) {  
                            saveAs(blob, titleImg);  
                            console.log("%c download screenshot "+ titleImg , "font-weight:bold;");
                            $canvas.remove();
                        } , "image/png" );
                    };
                    
                    img.src = image.img;
                } 
            },
            download: function() {
                // prima le img poi l'html  
                for(i in _report.data.images) {
                     _report.downloadImage(i);
                }
                // Save as file json and download
                // window.location.host
                var str = _report.data.header + 
                    "<script> var recap= " + JSON.stringify(_report.data.recap) + ";</script>" + _report.data.content + _report.data.footer;
                var title = "testReport - ";
                if(idSequence!== undefined && idSequence!==null) {
                    title += "S"+idSequence;
                }
                title += "T"+idTest + " - "+_runTest.test.title+".html";
                
                console.log("%c download report "+ title , "font-weight:bold;");
                
                saveAs(new Blob([str], {type: "text/html;charset=utf-8"}), title);  
            },
            downloadFlagForAnalisis: function() {
                var title = "testReportAnalize.json"; 
                
                str = JSON.stringify(_report.data.recap);
                
                console.log("%c download flag report for start images analisis "+ title , "font-weight:bold;");
                
                saveAs(new Blob([str], {type: "text/json;charset=utf-8"}), title); 
            }
        },
        
        // obj cookies
        
        _cookies = {
            list: [],       //popolato da cookies gsExt vari
            tempCookies : null , //popolato al load pagina in caso di submit /reload window durante runTest
            hostNameMatch : null , //x check pagine http / http / altri domini unificati sotto un unico sitoweb
            checkMultiDomains: function () { 
                for(i in hostNamesMatchList) {
                    hN = hostNamesMatchList[i];
                    //se hostname == nome raggruppamento hosts...
                    if(Object.keys(hN)[0] == window.location.hostname) {
                        //_cookies.hostNameMatch = hN[window.location.hostname] ;
                        
                        _cookies.hostNameMatch = [];
                        //x ora salvo solo il primo che equivale all'host name di riferimento
                        _cookies.hostNameMatch.push(hN[window.location.hostname][0]);
                        console.group('%c Match multi domains for '+ window.location.hostname, "font-weight:bold;");
                        console.table(hN);
                        console.groupEnd();
                    }   
                    else if(hN[Object.keys(hN)[0]].indexOf( window.location.protocol + "//" + window.location.hostname ) >= 0 ){
                        //se invece hostname fa parte di un raggruppamento .. 
                        _cookies.hostNameMatch = [];
                        //x ora salvo solo il l'host name di riferimento
                        _cookies.hostNameMatch.push(hN[Object.keys(hN)[0]][0]);
                        console.group('%c Match multi domains for ' + Object.keys(hN)[0] + " on " + window.location.hostname, "font-weight:bold;");
                        console.table(hN);
                        console.groupEnd();
                    }
                }    
            },
            getStorageTempCookies: function() {
                chrome.storage.sync.get(['tempCookies'], function(data) { 
                    if(data && data.tempCookies) {
                        _cookies.tempCookies = JSON.parse(data.tempCookies);
                        console.group('%c getStorageTempCookies' , 'font-weight:bold;');
                        console.table(_cookies.tempCookies);
                        console.groupEnd();
                    } 
                }); 
            },
            setStorageTempCookies: function() {
                chrome.storage.sync.set({'tempCookies':  JSON.stringify(_cookies.list) }, function() {});
                console.group('%c setStorageTempCookies' , 'font-weight:bold;');
                console.log(_cookies.list);
                console.groupEnd();
                //debugger;
            },
            clearStorageTempCookies: function() {
                chrome.storage.sync.set({'tempCookies':  JSON.stringify([]) }, function() {});
            },
            getCookies: function(callback) {
                
                //check domains
                _cookies.checkMultiDomains( );
                
                if(callback && typeof(callback) == "function") {
                    //eseguo eventuale callback richiesta
                    $(window).one('cookiesLoaded' , callback ) ;
                }
                //send request to get cookies from chrome
                if(_cookies.hostNameMatch && _cookies.hostNameMatch !== null ) {
                    arrHostClean = [];
                    for(i in _cookies.hostNameMatch) {
                        //x il get cookies devo passare domains senza http e https
                        arrHostClean.push(_cookies.hostNameMatch[i].replace(/.*?:\/\//g, ""));
                    } 
                    chrome.runtime.sendMessage({greeting: "getCookies" , domains: arrHostClean , path: "/"}, 
                    function(response) { 

                    }); 
                }
                else {
                    chrome.runtime.sendMessage({greeting: "getCookies" , domains: [window.location.hostname] , path: "/"}, function(response) { 

                    }); 
                } 
            },
            getCookie: function(cname) {
                //read cookie from cached list
                if(_cookies.list.length > 0 ) {
                    cookie = $.grep( _cookies.list , function(v) {
                        return v.name === cname;
                    });

                    if( cookie[0] ) return cookie[0].value;
                } 
                /*var name = cname + "=";
                var ca = document.cookie.split(';');
                for(var i=0; i<ca.length; i++) {
                    var c = ca[i];
                    while (c.charAt(0)==' ') c = c.substring(1);
                    if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
                }
                return "";*/
            },
            setCookies: function( newCookies , callback ){
                //send request to set cookies in chrome and set cookie in document after chrome response 
                $(window).one('cookiesUpdateLoaded' , function(){  
                    for(var c in newCookies) {
                        
                        cname = newCookies[c].name;
                        cvalue = newCookies[c].value;
                        //url = newCookies[i].url;
                        
                        //reset value prevented
                        _cookies.clear(cname);
                        //set doc cookie
                        _cookies.set(cname , cvalue , "1"); 
                    }
                    
                    if(callback && typeof(callback) == "function") {
                        callback.call(this);
                    }
                });                 
                console.warn({greeting: "setCookies" , cookies: newCookies });
                chrome.runtime.sendMessage({greeting: "setCookies" , cookies: newCookies }, function(response) {
                    //if (chrome.runtime.lastError) {
                    //    console.warn(chrome.runtime.lastError);
                    //}
                    console.warn(response); 
                });     
            },
            set: function( cname, cvalue, exdays ){
                //set cookie in document
                var d = new Date(); 
                d.setTime(d.getTime() + (exdays*24*60*60*1000));
                var expires = "expires="+d.toUTCString();
                document.cookie = cname + "=" + cvalue + "; path=/; " + expires;
                
                for(i in _cookies.list) {
                    //aggiorno cookies
                    //send request to get cookies from chrome
                    if(_cookies.hostNameMatch && _cookies.hostNameMatch !== null ) {
                        for(y in _cookies.hostNameMatch) {
                            //x il check cookies devo passare domains senza http e https
                            if(_cookies.list[i].domain == _cookies.hostNameMatch[y].replace(/.*?:\/\//g, "") && _cookies.list[i].name == cname ) {
                                _cookies.list[i].value = cvalue ; 
                            }
                        } 
                    }
                    else {
                        if(_cookies.list[i].domain == window.location.hostname && _cookies.list[i].name == cname ) {
                            _cookies.list[i].value = cvalue ; 
                        }
                    }
                }
            },
            clearAll: function( callback ){
                //send request to clear all cookies in chrome after forced clear all cookies in document too 
                _runTest.test = {}; //clear oggetto verifcare bug
                
                _cookies.clear("_gsExtAction");
                _cookies.clear("_gsExtNewTestTitle"); 
                _cookies.clear("_gsExtTest"); 
                _cookies.clear("_gsExtTestAction");   
                _cookies.clear("_gsExtTestSequence"); 
                _cookies.clear("_gsExtTestSequencePosition");   
                _cookies.clearStorageTempCookies();
                
                if(callback && typeof(callback) == "function") {
                    //eseguo eventuale callback richiesta
                    $(window).one('cookiesClearLoaded' , callback ) ;
                }
                
                if(_cookies.hostNameMatch && _cookies.hostNameMatch !== null ) {
                    arrHostClean = [];
                    arrUrl = [];
                    for(i in _cookies.hostNameMatch) {
                        //x il get cookies devo passare domains senza http e https
                        arrHostClean.push(_cookies.hostNameMatch[i].replace(/.*?:\/\//g, ""));
                        arrUrl.push(_cookies.hostNameMatch[i]+'/');
                    } 
                    chrome.runtime.sendMessage({greeting: "getClearCookies" , domains: arrHostClean , url: arrUrl }, 
                    function(response) { 

                    }); 
                }
                else {
                    chrome.runtime.sendMessage({greeting: "getClearCookies" , domains: [window.location.hostname] , url: [window.location.protocol+'//'+window.location.hostname+'/']}, function(response) { 

                    }); 
                } 
            },
            clear: function( cname ){
                //clear prevented in document
                document.cookie = cname + "=deleted; path=/; expires=" + new Date(0).toUTCString();
            },
            checkCookie: function() {}
        },  
            
        index = function() {
            idSequence = null;
            idTest = null;
            _report.data.recap = null;
            //callback da eseguire a cookie puliti  
            _cookies.clearAll(function() {
                action = "index"; 
                _cookies.set("_gsExtAction","index",1); 
                _modal.set('index');
                //nascondo bottombar x pointer
                _bottomBar.hide();
            });
        },
             
        clearAll = function() {
            _cookies.clearAll();
            //chrome.storage.sync.set({'savedTestList':  JSON.stringify([]) }, function() { });  
            chrome.storage.local.set({'savedTestList':  JSON.stringify([]) }, function() { });   
            chrome.storage.local.set({'savedSequenceList':  JSON.stringify([]) }, function() { });  
            chrome.storage.local.set({'reportTemp':  JSON.stringify([]) }, function() { });  
            //chrome.storage.sync.set({'reportTemp':  JSON.stringify([]) }, function() { });  
            chrome.storage.sync.set({'newTestTemp':  JSON.stringify([]) }, function() { });  
            //chrome.storage.sync.set({'settings':  JSON.stringify([]) }, function() { });  
            _savedTestList.list = []; 
            _savedTestList.sequencesList = [];
        },
        
        //obj test list
        
        _savedTestList = {
            list: [],
            sequencesList: [],
            import: function( callback ) {
                var importList = JSON.parse($('#_gsExtTestImportList').val()); 
                if(typeof(importList.savedTestList) == "object") {
                    for(var i in importList.savedTestList) {
                        _savedTestList.list.push(importList.savedTestList[i]);
                    }
                    //carico anche sequence
                    if(typeof(importList.savedSequenceList) == "object") {
                        for( i in importList.savedSequenceList) {
                            _savedTestList.sequencesList.push(importList.savedSequenceList[i]);
                        }
                    }
                    chrome.storage.local.set({'savedTestList':  JSON.stringify(_savedTestList.list),'savedSequenceList':  JSON.stringify(_savedTestList.sequencesList) }, function() {
                    
                        if(callback && typeof(callback) == "function") {
                            callback.call(this);
                        } 
                    });  
                }
            }, 
            export: function() {
                strjson = {
                    savedTestList: _savedTestList.list,
                    savedSequenceList: _savedTestList.sequencesList
                };
                saveAs(new Blob([JSON.stringify(strjson)], {type: "text/json;charset=utf-8"}), "savedTestList.json");  
            },
            uploadDialog: function() {
                action = "importList";
                _modal.set('importList');
            },
            selectDialog: function() { 
                //callback da eseguire a cookie puliti 
                _cookies.clearAll(function() {
                    if(_savedTestList.list.length > 0) {
                        action = "selectTest";
                        _modal.set('selectTest'); 
                    }
                }); 
            },
            selectSequenceDialog: function() {
                //callback da eseguire a cookie puliti 
                _cookies.clearAll(function() {
                    if(_savedTestList.sequencesList.length > 0) {
                        action = "selectTestSequence";
                        _modal.set('selectTestSequence'); 
                        $('#_gsExtTestSequenceList').off('change').on('change', function(){
                            tests = _savedTestList.sequencesList[$(this).val()].tests;
                            str="<ol id='_gsExtSelectedTests'>";
                            $.each(tests, function( v , k ) {
                                str += "<li>"+_savedTestList.list[k].title + " <small>"+utils.getDomain(_savedTestList.list[k].url) + "</small></li>";
                            });
                            str+="</ol>";
                            $('#_gsExtTests').html(str);
                        });
                
                    }
                }); 
            },
            newSequenceDialog: function() {
                action = "newSequence";
                _modal.set('newSequence');
                _savedTestList.setValidators();
            },
            saveSequence: function() {
                //creo oggetto sequence test
                obj = {
                    title: $('#_gsExtTestTitle').val(),
                    tests: []
                }; 
                //aggiungo tutti i test in sequenza
                $.each($('#_gsExtSelectedTests input'),function() {
                    obj.tests.push( $(this).val() );
                });
                
                 //salvo
                _savedTestList.sequencesList.push(obj);
                chrome.storage.local.set({'savedSequenceList':  JSON.stringify(_savedTestList.sequencesList) }, function() {
                    //torno a index
                    index();
                    _modal.open();
                }); 
            },
            setValidators: function() {
                _newTest.validAction = false;
                error = false,
                errorDiv =$('._gsExtError'),
                errorStr = "";
                
                title = '#_gsExtTestTitle';
                selectBtn ='#_gsExtAddTest';
                select ='#_gsExtTestList';
                tests ='#_gsExtSelectedTests input';
                submit = $('#_gsExtSaveSequence');  
                    
                checkTitle = function( noCheckAll ) {
                    if(validations.title($('#_gsExtTestTitle').val())) { 
                        errorStr = ""; 
                    }
                    else { 
                        errorStr ="Titolo troppo corto";
                        error = true;
                        errorDiv.html(errorStr).animate({opacity:1},500);
                    } 
                    if(noCheckAll === undefined || noCheckAll == "" ) checkAll();
                    return errorStr;
                };
                    
                checkTests= function( noCheckAll ) {
                    val = $(tests).length  ;
                    if( val < 2 ) {
                        error = true;
                        errorStr ="Selezionare almeno 2 test da eseguire in sequenza";
                        errorDiv.html(errorStr).animate({opacity:1},500);
                    }
                    else {
                        errorStr = ""; 
                    }
                    if(noCheckAll === undefined || noCheckAll == "" ) checkAll();
                    return errorStr;
                };
                
                checkAll = function() {
                    str = "";
                    str += checkTitle('all'); 
                    str += checkTests('all');
                        
                    if(str) { 
                        submit.attr('disabled','true'); 
                        error = true;  
                        errorStr = str;  
                        errorDiv.html(errorStr).animate({opacity:1},500);
                    }
                    else {
                        error = false;
                        submit.removeAttr('disabled');  
                        errorStr = "";  
                        errorDiv.animate({opacity:0},500);
                    }
                };
                
                $(title).off('keyup').on('keyup', function(){checkTitle();}); 
                $(selectBtn).off('click').on('click', function(){
                    _savedTestList.addTestInSequence();
                    checkTests(); 
                    //upd event remove + checks 
                    $('#_gsExtSelectedTests li a').off('click').on('click', function() {
                        $(this).parent().remove(); 
                        checkTests();
                    });
                }); 
            },
            addTestInSequence: function() {
                if($('#_gsExtTestList').val() ) {
                    addstr = '<li><input type="hidden" value="'+$('#_gsExtTestList').val()+'">' +$('#_gsExtTestList option[value="'+$('#_gsExtTestList').val()+'"]').text()+' <a href="#" >Remove</a></li>';
                    _modal.wrap.find('#_gsExtSelectedTests').append( $(addstr) ); 
                }
            }
        }, 
                
        // obj run test usato x runnare test
        
        _runTest = {
            sequence: {},   //obj tests sequence
            test: {},       //obj test
            error: false,   //test status
            errorText: "",  
            actionObj: {},  //temp runned action 
            init: function() {
                //reset vars
                _runTest.test = {};
                idAction = "0";
                idTest = null; 
                
                //setto i cookie e callback da eseguire x iniziare test
                onCookiesUpdated = function(){    
                    _cookies.getCookies( function(){
                        
                        //set cookies in chrome local storage to prevent lost data in case of hostname change
                        if(_cookies.hostNameMatch && _cookies.hostNameMatch !== null ) {
                            _cookies.setStorageTempCookies(); 
                        }
                        //popolo oggetto test
                        _runTest.test = utils.cloneObj(_savedTestList.list[$('#_gsExtTestList').val()]);  
                        _runTest.test.selectedViewport= $('#_gsExtTestViewport').val();

                        //preparo oggetto x report azioni 
                        _report.set('report');
                        //salvo oggetto recap da test ( usato x analize node js)
                        _report.data.recap = {};
                        _report.data.recap.type="test";
                        _report.data.recap.id = $('#_gsExtTestList').val();
                        _report.data.recap.title = _runTest.test.title; 
                        _report.data.recap.actions = utils.cloneObj(_runTest.test.actions);  
                        _report.data.recap.selectedViewport = _runTest.test.selectedViewport;
                        _report.updateRecap();

                        //reload pagina url x init test
                        $(window).one('windowResized',function(){ 
                            window.location.href = _runTest.test.url;
                        });

                        //set window size in base a viewport e poi inizio
                        _resizer.resizeWindowAtViewport( _resizer.viewports[_runTest.test.selectedViewport] );
                    } );
                };

                if(_cookies.hostNameMatch && _cookies.hostNameMatch !== null ) {
                    cookiesUpd = [];
                    for(i in _cookies.hostNameMatch) {
                        cookiesUpd.push({url:_cookies.hostNameMatch[i]  , name:"_gsExtAction",value:"runTest"});
                        cookiesUpd.push({url:_cookies.hostNameMatch[i]  , name:"_gsExtTest",value:$('#_gsExtTestList').val()});
                        cookiesUpd.push({url:_cookies.hostNameMatch[i]  , name:"_gsExtTestAction",value:"0"});
                    } 
                }
                else {
                    //se sno in https non va
                    cookiesUpd = [
                        {url:window.location.protocol+"//"+window.location.hostname  , name:"_gsExtAction",value:"runTest"},
                        {url:window.location.protocol+"//"+window.location.hostname  , name:"_gsExtTest",value:$('#_gsExtTestList').val()},
                        {url:window.location.protocol+"//"+window.location.hostname  , name:"_gsExtTestAction",value:"0"}
                    ]; 
                }  

                _cookies.setCookies(cookiesUpd , onCookiesUpdated);
            },
            initSequence: function() {
                //reset vars
                _runTest.sequence = {}; 
                _runTest.test = {};
                idAction = "0";
                currentSequencePos = "0";
                idSequence = $('#_gsExtTestSequenceList').val();
                idTest = _savedTestList.sequencesList[idSequence].tests[0];
                
                //get idTest 
                
                //setto i cookie e callback da eseguire x iniziare test
                onCookiesUpdated = function(){    
                     
                    _cookies.getCookies( function(){
                        
                        //set cookies in chrome local storage to prevent lost data in case of hostname change
                        if(_cookies.hostNameMatch && _cookies.hostNameMatch !== null ) {
                            _cookies.setStorageTempCookies(); 
                        }
                        
                        //popolo oggetto test
                        _runTest.test = utils.cloneObj(_savedTestList.list[idTest]);  
                        _runTest.test.selectedViewport= $('#_gsExtTestViewport').val();

                        //preparo oggetto x report azioni 
                        _report.set('report');
                        
                        //salvo oggetto recap da test ( usato x analize node js)
                        _report.data.recap = {};
                        _report.data.recap.type="sequence";
                        _report.data.recap.id = idSequence;
                        _report.data.recap.title = _savedTestList.sequencesList[idSequence].title; 
                        _report.data.recap.selectedViewport = _runTest.test.selectedViewport;
                        _report.data.recap.test= {};
                        _report.data.recap.test["T"+idTest] = {};  
                        _report.data.recap.test["T"+idTest].actions = utils.cloneObj(_runTest.test.actions);  
                        _report.data.recap.test["T"+idTest].title = _runTest.test.title;  
                        _report.updateRecap(); 
                        

                        //reload pagina url x init test
                        $(window).one('windowResized',function(){ 
                            window.location.href = _runTest.test.url;
                        });

                        //set window size in base a viewport e poi inizio
                        _resizer.resizeWindowAtViewport( _resizer.viewports[_runTest.test.selectedViewport] ); 
                    } );
                };

                if(_cookies.hostNameMatch && _cookies.hostNameMatch !== null ) {
                    cookiesUpd = [];
                    for(i in _cookies.hostNameMatch) {
                        cookiesUpd.push({url:_cookies.hostNameMatch[i]  , name:"_gsExtTestSequence",value:idSequence});
                        cookiesUpd.push({url:_cookies.hostNameMatch[i]  , name:"_gsExtTestSequencePosition",value:"0"});
                        cookiesUpd.push({url:_cookies.hostNameMatch[i]  , name:"_gsExtAction",value:"runTest"});
                        cookiesUpd.push({url:_cookies.hostNameMatch[i]  , name:"_gsExtTest",value:idTest});
                        cookiesUpd.push({url:_cookies.hostNameMatch[i]  , name:"_gsExtTestAction",value:"0"});
                    } 
                }
                else {
                    //se sno in https non va
                    cookiesUpd = [ 
                        {url:window.location.protocol+"//"+window.location.hostname  , name:"_gsExtTestSequence",value:idSequence},
                        {url:window.location.protocol+"//"+window.location.hostname  , name:"_gsExtTestSequencePosition",value:"0"},
                        {url:window.location.protocol+"//"+window.location.hostname  , name:"_gsExtAction",value:"runTest"},
                        {url:window.location.protocol+"//"+window.location.hostname  , name:"_gsExtTest",value:idTest},
                        {url:window.location.protocol+"//"+window.location.hostname  , name:"_gsExtTestAction",value:"0"}
                    ]; 
                }  

                _cookies.setCookies(cookiesUpd , onCookiesUpdated);
            },
            nextTestSequence: function() {
                //reset vars
                _runTest.test = {};
                idAction = "0"; 
                 
                if(_cookies.hostNameMatch && _cookies.hostNameMatch !== null ) {
                    cookiesUpd = [];
                    for(var i in _cookies.hostNameMatch) {
                        cookiesUpd.push({url:_cookies.hostNameMatch[i]  , name:"_gsExtTestSequence",value:idSequence});
                        cookiesUpd.push({url:_cookies.hostNameMatch[i]  , name:"_gsExtTestSequencePosition",value:currentSequencePos.toString()});
                        cookiesUpd.push({url:_cookies.hostNameMatch[i]  , name:"_gsExtAction",value:"runTest"});
                        cookiesUpd.push({url:_cookies.hostNameMatch[i]  , name:"_gsExtTest",value:idTest});
                        cookiesUpd.push({url:_cookies.hostNameMatch[i]  , name:"_gsExtTestAction",value:"0"});
                    } 
                }
                else {
                    //se sno in https non va
                    cookiesUpd = [ 
                        {url:window.location.protocol+"//"+window.location.hostname , name:"_gsExtTestSequence",value:idSequence},
                        {url:window.location.protocol+"//"+window.location.hostname , name:"_gsExtTestSequencePosition",value:currentSequencePos.toString()},
                        {url:window.location.protocol+"//"+window.location.hostname , name:"_gsExtAction",value:"runTest"},
                        {url:window.location.protocol+"//"+window.location.hostname , name:"_gsExtTest",value:idTest},
                        {url:window.location.protocol+"//"+window.location.hostname , name:"_gsExtTestAction",value:"0"}
                    ]; 
                }   
                _cookies.setCookies(cookiesUpd , function(){   
                    
                    _cookies.getCookies( function(){
                        //set cookies in chrome local storage to prevent lost data in case of hostname change
                        if(_cookies.hostNameMatch && _cookies.hostNameMatch !== null ) { 

                            _cookies.setStorageTempCookies();
                        }

                        //popolo oggetto test
                        _runTest.test = utils.cloneObj(_savedTestList.list[idTest]);  
                        //reimpost repost
                        _report.set('report');
                        
                        //salvo oggetto recap da test ( usato x analize node js)
                        if(_report.data.recap.type=="sequence") {
                            _report.data.recap.test["T"+idTest] = {};  
                            _report.data.recap.test["T"+idTest].actions = utils.cloneObj(_runTest.test.actions);  
                            _report.data.recap.test["T"+idTest].title = _runTest.test.title;  
                        }
                        _report.updateRecap(); 
                        
                        //reload page 
                        window.location.href = _runTest.test.url;
                    });
                });   
            },
            runTextComparation: function() {
                var regex ="",
                    res="",
                    string= $(refObj).filter(':visible')[0].textContent;
                
                if(_runTest.actionObj.regType==1 || _runTest.actionObj.regType==2) {
                    //uguale || diversa
                    regex = new RegExp( "^("+_runTest.actionObj.value+")$", 'g' );
                    res = string.match(regex);
                    if(_runTest.actionObj.regType==1) {
                        _report.update("<div >Text comparation - equal to: "+_runTest.actionObj.value+"</div>");  
                    }
                    else {
                        _report.update("<div >Text comparation - not equal to: "+_runTest.actionObj.value+"</div>");  
                    }
                }
                else if(_runTest.actionObj.regType==3) {
                    //valore contenuto nella stringa
                    regex = new RegExp( "("+_runTest.actionObj.value+")", 'g' );
                    res = string.match(regex);
                    _report.update("<div >Text comparation - "+_runTest.actionObj.value+" contain into text</div>");  
                }
                else if(_runTest.actionObj.regType==4) {
                    //finisce per
                    regex = new RegExp( ".("+_runTest.actionObj.value+")$", 'g' );
                    res = string.match(regex);
                    _report.update("<div >Text comparation - end with: "+_runTest.actionObj.value+"</div>"); 
                }
                else if(_runTest.actionObj.regType==5) {
                    //inizia per
                    regex = new RegExp( "^("+_runTest.actionObj.value+")+", 'g' );
                    res = string.match(regex);
                    _report.update("<div >Text comparation - start with: "+_runTest.actionObj.value+"</div>"); 
                }
                else if(_runTest.actionObj.regType == 6 || _runTest.actionObj.regType == 7) {
                    // num > val || num < val
                    res = parseInt(string);
                    val = parseInt(_runTest.actionObj.value);
                    if(_runTest.actionObj.regType==6) {
                        _report.update("<div >Text comparation - greater than: "+_runTest.actionObj.value+"</div>");  
                    }
                    else {
                        _report.update("<div >Text comparation - less than: "+_runTest.actionObj.value+"</div>");  
                    }
                }
                            
                if(_runTest.actionObj.regType == 6 || _runTest.actionObj.regType == 7) {
                    if( isNaN(res) || isNaN(val)) {
                        _runTest.error = true;
                        if(isNaN(res)) {
                            _runTest.errorText ='Error: text "'+_runTest.actionObj.value+'" is not a number'; 
                        }
                        else {
                            _runTest.errorText ='Error: text "'+refObj+'" is not a number';  
                        } 
                    }
                    else if(val >= res && _runTest.actionObj.regType== 6) {
                        _runTest.error = true; 
                        _runTest.errorText ='Error: text "'+refObj+'" is not greater than '+ _runTest.actionObj.value; 
                    }
                    else if(val <= res && _runTest.actionObj.regType== 7) {
                        _runTest.error = true;
                        _runTest.errorText ='Error: text "'+refObj+'" is not less than '+_runTest.actionObj.value; 
                    } 
                }
                else if((res === null && _runTest.actionObj.regType!=2 ) || ( res !== null && _runTest.actionObj.regType==2)){
                    _runTest.error = true;
                    if(_runTest.actionObj.regType==2) {
                        _runTest.errorText ='Error: text "'+_runTest.actionObj.value+'" in '+ refObj + ' found'; 
                    }
                    else {
                        _runTest.errorText ='Error: text "'+_runTest.actionObj.value+'" in '+ refObj + ' not found';
                    } 
                } 
            }, 
			execAction: function() {
				var runDelay = 200 ;
				
				if(_runTest.error === false && _runTest.actionObj.action == 'click') {
					//aspetto 100ms prima di cliccare
					setTimeout(function(){  
						//$(refObj).filter(':visible').trigger('click'); 
						$(refObj).filter(':visible')[0].click(); 
						//report test action
						_report.update("<p >Click on "+ refObj + "</p>");    
						
					},runDelay);
				}
				else if(_runTest.error === false && _runTest.actionObj.action == 'select') {
					//$(refObj).filter(':visible').find('option').removeAttr('selected');  
					//$(refObj).filter(':visible').find('option[value="'+_runTest.actionObj.value+'"]')[0].selected = true;	
					//$(refObj).filter(':visible').find('option[value="'+_runTest.actionObj.value+'"]').attr('selected','selected');
					//$(refObj).filter(':visible')[0].value = _runTest.actionObj.value;
					//aspetto 100ms prima di lanciare evento change 
					
					setTimeout(function(){ 
						//var event = document.createEvent("HTMLEvents");
						//event.initEvent("change", false, true);
						//var event = new Event('change'); 
						$(refObj).focus().val(_runTest.actionObj.value).change();
						//$(refObj).filter(':visible')[0].dispatchEvent(event); 
						//$(refObj).filter(':visible').trigger('change');
						//report test action
						_report.update("<p >Select "+_runTest.actionObj.value+" ("+ $(refObj).filter(':visible').find('option[value="'+_runTest.actionObj.value+'"]').text() +") in "+ refObj + "</p>");   
					},runDelay);
				}
				else if(_runTest.error === false && _runTest.actionObj.action == 'write') {
					//scrivo subito in base a regType 
					setTimeout(function(){  
						if(_runTest.actionObj.regType === undefined || _runTest.actionObj.regType == "" || _runTest.actionObj.regType == "1") {
							$(refObj).filter(':visible').val(_runTest.actionObj.value);
							//report test action
							_report.update("<p >Write "+_runTest.actionObj.value+" in "+ refObj + "</p>"); 
						}
						else if(_runTest.actionObj.regType == "4") {
							//copio valore da altro input (es utile x conferma mail)
							val = $(_runTest.actionObj.value).filter(':visible').val();
							$(refObj).filter(':visible').val(val);
							_report.update("<p >Write "+val+" in "+ refObj + "</p>"); 
						}
						else if( _runTest.actionObj.regType =="2" ||  _runTest.actionObj.regType == "3") {
							if( _runTest.actionObj.regType == "3") val = utils.randomMail();
							else val = utils.randomStr();
							$(refObj).filter(':visible').val(val);
							//report test action
							_report.update("<p >Write "+val+" in "+ refObj + "</p>"); 
						}  
					},runDelay);
				}
				else if(_runTest.error === false && _runTest.actionObj.action == 'text comparation') { 
					//report test action scritta in check runTextComparation
					//_report.update("<div >Write "+_runTest.actionObj.value+" in "+ refObj + "</div>"); 
				}
				else {
					//report test action "is visible"
					setTimeout(function(){  
						_report.update("<p >"+ refObj + " is visible</p>");   
					},runDelay);
				}
			},
            run: function() {
                
                if(_runTest.test && _runTest.test.actions && _runTest.test.actions[idAction]) {
                    _runTest.error = false,
                    _runTest.actionObj = _runTest.test.actions[idAction];

                    //log azione da eseguire ( se prima azione faccio recap di tutte le azioni)
                    if(idAction > 0 ) {
                        console.group('%c Run action #'+ idAction + " " + _runTest.actionObj.title, "font-weight:bold;");
                        console.table([_runTest.actionObj],['title','action','matchString','editMatchString','value','sleep','screenshot']);
                    }
                    else {
                        console.info('%c Run Test: '+ _runTest.test.title, "font-weight:bold;");
                        console.group('%c Run action #'+ idAction + " " + _runTest.actionObj.title, "font-weight:bold;");
                        console.table(_runTest.test.actions,['title','action','matchString','editMatchString','value','sleep','screenshot']);
                        _report.update('<ul class="accordion" data-accordion data-allow-all-closed="true">');
                    } 
                    //report action to run
                    if(_runTest.actionObj.screenshot == "true") { 
                        title= "<span class=\"primary label\">ACTION #"+ idAction + "</span> " + _runTest.actionObj.title + " <i class=\"fa fa-camera\" aria-hidden=\"true\"></i>";
                    }
                    else { 
                        title= "<span class=\"primary label\">ACTION #"+ idAction + "</span> " + _runTest.actionObj.title; 
                    }
                    _report.update(
                        "<li class=\"accordion-item\" data-accordion-item>"+
                        "<a href=\"#\" class=\"accordion-title\">"+title+"</a>"+
                        "<div class=\"accordion-content\" data-tab-content>" 
                    );  
                    //notification
                    _notify.sendRequest({ type: "progress", title: _runTest.test.title , message: "Run action #"+idAction + ": "+_runTest.test.actions[idAction].title , progress: parseInt( 100 * ( idAction / _runTest.test.actions.length )) });
                    
                    //1 check is visible dopo sleep
                    setTimeout(function(){
                        if(_runTest.actionObj.editMatchString !== undefined && _runTest.actionObj.editMatchString !== "") {
                            refObj = _runTest.actionObj.editMatchString;  
                        }
                        else {
                            refObj = _runTest.actionObj.matchString; 
                        }
                        
                        if($(refObj).filter(':visible').length != 1) {
                            _runTest.error = true; 
                            _runTest.errorText ='Error: '+ refObj + ' not found or not visible';
                        }

                        if(_runTest.error === false && _runTest.actionObj.action == 'text comparation'){
                            //regexp text and values compare 
                            _runTest.runTextComparation();
                        }
                        
                        if(_runTest.error === true) {
                            
                            console.warn(_runTest.errorText); 
                            //report test error
                            _report.update("<p style='color:red;'>"+_runTest.errorText+"</p>");  
                            
                            //salvo oggetto recap da test ( usato x analize node js)
                            if(_report.data.recap.type=="test") {
                                _report.data.recap.result = "failed";
                                _report.data.recap.errorActionId = idAction;
                                _report.data.recap.errorAction = utils.cloneObj(_runTest.actionObj);
                                _report.data.recap.errorText = _runTest.errorText;
                            }
                            else if(_report.data.recap.type=="sequence") {
                                _report.data.recap.test["T"+idTest].result = "failed";
                                _report.data.recap.test["T"+idTest].errorActionId = idAction;
                                _report.data.recap.test["T"+idTest].errorAction = utils.cloneObj(_runTest.actionObj);
                                _report.data.recap.test["T"+idTest].errorText = _runTest.errorText;
                            }
                            _report.updateRecap(); 
                            
                            //notification
                            _notify.sendRequest({ type: "progress", title: _runTest.test.title , message: 'Error: '+ refObj + ' not found or not visible - Test failed' , progress: 100 });  
                            //reset unload check
                            window.onunload = "";
                            //download report with screenshot e gestisco x ora callback in base a str 
                            $(window).one('screenshotPartial',function(){
                                _report.update("</div></li>");  
                                
                                console.warn('Error: '+ _runTest.test.title + ' - action #'+idAction+' not found');
                                //report test fail
                                _report.update(
                                    "<li class=\"accordion-item\" data-accordion-item>"+
                                "<a href=\"#\" class=\"accordion-title\"><span class=\"alert label\">TEST FAILED</span> Error: action #"+idAction+"</a>"+
                                "<div class=\"accordion-content\" data-tab-content>" );  
                                _report.update("<p style='color:red;'>"+_runTest.errorText+"</p>"); 
                                _report.update("</div></li></ul>");   
                                _report.download();
                                //go to main menu o next text
                                if(idSequence && idSequence!== undefined) {
                                    idAction = "0";
                                    currentSequencePos = parseInt(currentSequencePos)+1; 
                                    idTest = _savedTestList.sequencesList[idSequence].tests[currentSequencePos];
                                    if(idTest) {
                                        //vado a next test della sequenza 
                                        setTimeout( _runTest.nextTestSequence , 2000 );
                                    }
                                    else {
                                        //fine sequence - creo flag file x iniziare images analisis 
                                        _report.downloadFlagForAnalisis();
                                        //fine
                                        index();
                                        _modal.open();
                                    }
                                }
                                else {
                                    //fine test -creo flag file x iniziare images analisis
                                    _report.downloadFlagForAnalisis();
                                    index();
                                    _modal.open(); 
                                } 
                            });
                            _runTest.getScreenshot('');

                        }
                        else {
                            var runDelay = 200 ;
                            if(_runTest.actionObj.scrollToElement !== undefined && _runTest.actionObj.scrollToElement == "true") {
                                //2 scroll to element 
                                //runDelay = 300 ;
                                
                                if(_runTest.actionObj.customScrollbars !== undefined && _runTest.actionObj.customScrollbars == "auto") {
                                    //,'nicescroll','jscrollpane'
                                    var checkScrollbar = $(refObj).filter(':visible').parents('.jspPane, [tabindex]').first();
                                    if(checkScrollbar.length && checkScrollbar.attr('[tabindex]') !== undefined && $('body').find('.nicescroll-rails').length) {
                                        _runTest.actionObj.customScrollbars = "nicescroll";
                                    }
                                    else if(checkScrollbar.length && checkScrollbar.hasClass('jspPane')) {
                                        _runTest.actionObj.customScrollbars = "jscrollpane";
                                    }
                                    
                                }
                                
                                if(_runTest.actionObj.customScrollbars !== undefined && _runTest.actionObj.customScrollbars == "jscrollpane" && $(refObj).filter(':visible').parents('.jspPane').length) {
                                    var jspContainer = $(refObj).filter(':visible').parents('.jspPane').first(),
                                        scrollToPos = -1 * ($(refObj).filter(':visible').offset().top - jspContainer.offset().top + jspContainer.scrollTop());
                                    jspContainer.css({ top: scrollToPos + 60 });
                                }
                                else if(_runTest.actionObj.customScrollbars !== undefined && _runTest.actionObj.customScrollbars == "nicescroll" && $(refObj).filter(':visible').parents('[tabindex]').length && $('body').find('.nicescroll-rails').length ) { 
                                    var nicescrollContainer = $(refObj).filter(':visible').parents('[tabindex]').first();
                                    var scrollToPos = -1 * ($(refObj).filter(':visible').offset().top /*+ $(refObj).filter(':visible').height()*/ - nicescrollContainer.offset().top + nicescrollContainer.scrollTop());
                                    
                                    var nice,
                                        tabIndexOrig,
                                        tabIndex;
                                    
                                    if(nicescrollContainer.getNiceScroll(0) === false ) {
                                        
                                        tabIndexOrig = parseInt($(refObj).filter(':visible').parents('[tabindex]').first().attr('tabindex')) - 3000;
                                        
                                        var tempAttr = $('#ascrail'+tabIndexOrig).children().attr('style');
                                        nice = nicescrollContainer.niceScroll();
                                        tabIndex = nice.id;
                                        //setto style inline guardando originale .nicescroll-cursors

                                        $('#'+tabIndex).children().attr('style', tempAttr);
                                        $('#'+tabIndex+'-hr').children().attr('style', tempAttr );
                                    }
                                    else {
                                        nice = nicescrollContainer.getNiceScroll(0);
                                        tabIndex = nice.id;
                                    }
                                    
                                    //calcolo distanza percentuale nel container 
                                    var nicescrollContainerHeight = nicescrollContainer[0].scrollHeight;
                                    //scrollToPos = scrollToPos - 60;
                                    var dist = -1 * ( scrollToPos + $('#'+tabIndex).children().height());
                                    setTimeout(function(){ 
                                        nice.doScrollTop(dist, -1 );
                                    },500);
                                    runDelay = 575 ;
                                }
                                else {
                                    $('html,body').animate({ scrollTop: $(refObj).filter(':visible').offset().top - 60 }, 50);
                                }
                            }
                            
                            //3 eseguo eventuale azione
							_runTest.execAction(); 
							
                            //se ho screenshot aspetto di riceverlo x proseguire con il test 
                            //se non ho screenshot triggero evento manualmente x proseguire
                            $(window).one('screenshotPartial',function(){
                                 
                                //3 vado a prossima azione
                                idAction = parseInt(idAction) + 1;
                                //se ci sta un submit con reload della pagina devo gestirlo entro 2 secondi
                                function onUnloadCallback () {
                                    _report.update("</div></li>"); 
                                    _cookies.clear("_gsExtTestAction"); 
                                    _cookies.set("_gsExtTestAction", idAction.toString() ,1);
                                    //set cookies in chrome local storage to prevent lost data in case of hostname change
                                    if(_cookies.hostNameMatch && _cookies.hostNameMatch !== null ) {
                                        _cookies.setStorageTempCookies();
                                    }
                                    //report unload event
                                    clearTimeout(runNextTestAction);
                                }
                                window.onunload = onUnloadCallback ;

                                //fine azione: aspetto 2 secondi e lancio azione next ( se xo avviente un reload pagina stoppo tutto e attivo callback equivalente x lancio azione next in tempo e gestire reload )
 
  
                                _cookies.clear("_gsExtTestAction");
                                _cookies.set("_gsExtTestAction", idAction.toString() ,1);
                                //set cookies in chrome local storage to prevent lost data in case of hostname change
                                if(_cookies.hostNameMatch && _cookies.hostNameMatch !== null ) {
                                    _cookies.setStorageTempCookies(); 
                                }
                                var runNextTestAction = setTimeout( function(){
                                    _report.update("</div></li>"); 
                                    _runTest.run();
                                }, 2000 );
                            });

                            //screenshot e poi vado a next action 
                            setTimeout(function(){  
                                if(_runTest.error === false && _runTest.actionObj.screenshot == "true") {
                                    _runTest.getScreenshot('');
                                }
                                else {
                                    $(window).trigger('screenshotPartial');
                                }
                            },runDelay + 25 );
                        }
                        console.groupEnd();

                    },1000 * _runTest.actionObj.sleep); 
                }  
                else{
                    //end test / test fail
                    //unset window unload check
                    window.onunload = "";
                    if(_runTest.test.actions.length <= idAction) {
                        //test run successfull!   
                        console.info('%c '+ _runTest.test.title + ' passed ','color:green;font-weight:bold;');
                        
                        //salvo oggetto recap da test ( usato x analize node js)
                        if(_report.data.recap.type=="test") {
                            _report.data.recap.result = "passed";
                        }
                        else if(_report.data.recap.type=="sequence") {
                            _report.data.recap.test["T"+idTest].result = "passed";
                        }
                        _report.updateRecap(); 
                        
                        //report test success
                        _report.update(
                            "<li class=\"accordion-item\" data-accordion-item>"+
                        "<a href=\"#\" class=\"accordion-title\"><span class=\"success label\">TEST PASSED</span></a>"+
                        "<div class=\"accordion-content\" data-tab-content>" );   
                        
                        //notification
                        _notify.sendRequest({ type: "progress", title: _runTest.test.title , message: "Test passed" , progress:100 }); 
                    }
                    else {
                        //test failed
                        _runTest.errorText = 'action #'+idAction+' not found';
                        console.warn('Error: '+ _runTest.test.title + ' - ' + _runTest.errorText);
                        
                        //salvo oggetto recap da test ( usato x analize node js)
                        if(_report.data.recap.type=="test") {
                            _report.data.recap.result = "failed";
                            _report.data.recap.errorActionId = idAction;
                            _report.data.recap.errorAction = {};
                            _report.data.recap.errorText = _runTest.errorText;
                        }
                        else if(_report.data.recap.type=="sequence") {
                            _report.data.recap.test["T"+idTest].result = "failed";
                            _report.data.recap.test["T"+idTest].errorActionId = idAction;
                            _report.data.recap.test["T"+idTest].errorAction = {};
                            _report.data.recap.test["T"+idTest].errorText = _runTest.errorText;
                        }
                        _report.updateRecap(); 
                            
                        //report test fail
                        _report.update(
                            "<li class=\"accordion-item\" data-accordion-item>"+
                        "<a href=\"#\" class=\"accordion-title\"><span class=\"alert label\">TEST FAILED</span> Error: action #"+idAction+" not found</a>"+
                        "<div class=\"accordion-content\" data-tab-content>" );  
                         
                        //notification
                        _notify.sendRequest({ type: "progress", title: _runTest.test.title , message: "Test failed", progress:100 }); 
                    }
                    //download report with screenshot e gestisco x ora callback in base a str 
                    
                    $(window).one('screenshot',function(){
                        //go to main menu o next text
                        _report.update("</div></li></ul>");  
                        if(idSequence && idSequence!== undefined) {
                            idAction = "0";
                            currentSequencePos = parseInt(currentSequencePos)+1; 
                            idTest = _savedTestList.sequencesList[idSequence].tests[currentSequencePos];
                            if(idTest) {
                                //vado a next test della sequenza
                                setTimeout( function(){
                                    _runTest.nextTestSequence();
                                } , 2000 );
                            }
                            else {
                                //fine test -creo flag file x iniziare images analisis
                                _report.downloadFlagForAnalisis();
                                //fine
                                index();
                                _modal.open();
                            }
                        }
                        else {
                            //fine test -creo flag file x iniziare images analisis
                            _report.downloadFlagForAnalisis();
                            index();
                            _modal.open(); 
                        } 
                    });
                    
                    _runTest.getScreenshot('runTestReport');
                }
            },
            getScreenshot: function(requestType) {
                if(requestType == 'runTestReport') {
                    //ultimo screenshot 
                    chrome.runtime.sendMessage({greeting: "getScreenshot" }, function(response) { });  
                    timer = setTimeout(function(){ _report.download();  },2000);
                }
                else {
                    chrome.runtime.sendMessage({greeting: "getScreenshotPartial" }, function(response) { }); 
                    timer = setTimeout(function(){ $(window).trigger('screenshotPartial'); },2000);
                }
            }
        },
        
        // obj test validators
        
        _validators = {
            showError: function( errorMsg , noCheckAll) {
                var errorDiv =$('._gsExtError');
                var replaceStr = errorDiv.html();
                var submit2 = $('#_gsExtSaveTest');
                var submit = $('#_gsExtAddAction');
                
                errorMsg = "<span>"+errorMsg+"</span>";
                
                replaceStr = replaceStr.replace(errorMsg,"");
                errorDiv.html(replaceStr + " " + errorMsg);
                errorDiv.animate({opacity:1},500);
                
                if(noCheckAll === undefined || noCheckAll == "" ) {
                    submit.attr('disabled','true'); 
                    submit2.attr('disabled','true'); 
                }
            },
            hideError: function( errorMsg , noCheckAll) {
                var errorDiv =$('._gsExtError');
                var replaceStr = errorDiv.html();
                
                errorMsg = "<span>"+errorMsg+"</span>";
                
                replaceStr = replaceStr.replace(errorMsg,"").trim();
                errorDiv.html(replaceStr);
                
                if(replaceStr.length) {
                    errorDiv.animate({opacity:1},500);
                }
                else {
                    errorDiv.animate({opacity:0},500);
                    //check x sbloccare submit
                    if(noCheckAll === undefined || noCheckAll == "" ) {
                        _validators.checkAll();
                    }
                }
            },
            checkAll: function() {
                //blocca / sblocca submit
                var totErrors = 0 ;
                var actions ='#_gsExtTestActions select:first';
                var submit2 = $('#_gsExtSaveTest');
                var submit = $('#_gsExtAddAction');
                
                totErrors += _validators.checkTitle();
                totErrors += _validators.checkQueryString();
                   
                if($(actions).val() == "write" ) {
                    totErrors += _validators.checkActionWrite();
                } 
                else if($(actions).val() == "select" ) {
                    totErrors += _validators.checkActionChange();
                } 
                else if($(actions).val() == "text comparation" ) {
                    totErrors += _validators.checkActionCompare('','','noCheckAll');
                } 
                
                if(totErrors) {
                    submit.attr('disabled','true'); 
                    submit2.attr('disabled','true'); 
                }
                else {
                    submit.removeAttr('disabled');  
                    submit2.removeAttr('disabled'); 
                }
            },
            checkTitle: function(onSuccess, onFail) {
                var title = '#_gsExtTestTitle';
                
                if(validations.title($(title).val())) {
                    if(typeof(onSuccess) =="function") onSuccess();
                    return 0;
                }
                else {
                    if(typeof(onFail) =="function") onFail();
                    return 1;
                }
            },
            checkScrollToElement: function( ) {
                var val = $('#_gsExtTestScroll').val() ;
                if(!val || val == "false" ) { 
                    $('._gsExtTestScrollOptions').remove(); 
                }
                else { 
                    var str = '';
                    $(customScrollbars).each(function() {
                        if(this == 'auto detect') {
                            str +='<li data-reg="'+this+'" class="selected" >'+this+'</li>';
                        }
                        else {
                            str +='<li data-reg="'+this+'" >'+this+'</li>';
                        }
                    });
                    $('._gsExtTestScrollOptions').remove();   
                    $('<div class="_gsExtTestScrollOptions"><label>Custom scrollbar: </label><ul>'+ str +'</ul></div>').insertAfter('#_gsExtTestScroll');
                           
                    $('._gsExtTestScrollOptions').find('li').off('click').on('click',function() {
                        $('._gsExtTestScrollOptions').find('li').removeClass('selected');
                        $(this).addClass('selected');
                    });
                }
            }, 
            checkQueryString: function(onSuccess, onFail) {
                var str2 = '',
                    statusError = 0,
                    string = $('#_gsExtTextEditQuery').find('input').val(); 
                string = $(string);
                
                if( string.filter(':visible').length == 1) {
                    if(typeof(onSuccess) =="function") onSuccess();
                    str2 = "<i class='green'>"+string.filter(':visible').length + ' visible results</i>'; 
                }
                else if( string.filter(':visible').length > 1 ) {
                    if(typeof(onFail) =="function") onFail();
                    statusError = 1  ;
                    str2 = "<i class='orange'>"+string.filter(':visible').length + ' visible results</i>';   
                }
                else {
                    if(typeof(onFail) =="function") onFail();
                    statusError = 1  ;
                    str2 = "<i class='red'>"+string.filter(':visible').length + ' visible results</i>';  
                }
                $('#_gsExtTextEditQuery').find('span').html ( str2 + ' / ' + string.length + ' not visible results' );
                return statusError;
            },
            setActionWrite: function(onSuccess, onFail) {
                $('._gsExtTestActionsSelect select').off('change');
                $('._gsExtTestActionsSelect').remove(); 
                $('#_gsExtTestCompare').off('keyup');
                $('._gsExtTestActionsCompare').remove();  
                $('#_gsExtTestActions').append(
                    '<div class="_gsExtTestActionsWrite"><label>Valore da immettere: </label>'+
                    '<ul><li data-reg="1" class="selected" >Valore esatto</li>'+ 
                    '<li data-reg="2">Random str</li>'+ 
                    '<li data-reg="3">Random email</li>'+ 
                    '<li data-reg="4" class="big">Valore uguale ad altro input ( indicare query string )</li></ul>'+ 
                    '<input type="text" name="_gsExtTestWrite" id="_gsExtTestWrite" ></div>'
                );
                    
                $('#_gsExtTestWrite').off('keyup').on('keyup', function() { 
                    _validators.checkActionWrite(onSuccess, onFail); 
                });
                
                $('._gsExtTestActionsWrite').find('li').off('click').on('click',function() {
                    $('._gsExtTestActionsWrite').find('li').removeClass('selected');
                    $(this).addClass('selected');
                    
                    _validators.checkActionWrite(onSuccess, onFail);
                    
                    if($(this).attr('data-reg') == '1' || $(this).attr('data-reg') == '4') {
                        $('#_gsExtTestWrite').removeAttr('disabled'); 
                    }
                    else {
                        $('#_gsExtTestWrite').attr('disabled','true'); 
                    } 
                });
            },
            checkActionWrite: function(onSuccess, onFail) {
                var val = $('#_gsExtTestWrite').val().length ;
                var statusError = 0;
                if(val < 1 && $('._gsExtTestActionsWrite').find('li.selected').attr('data-reg') == '1' ) {
                    if(typeof(onFail) =="function") onFail();
                    statusError = 1;
                }
                else {
                    if(typeof(onSuccess) =="function") onSuccess();
                }
                return statusError;
            },
            setActionChange: function(onSuccess, onFail) {
                $('#_gsExtTestWrite').off('keyup');
                $('._gsExtTestActionsWrite').remove();  
                $('#_gsExtTestCompare').off('keyup');
                $('._gsExtTestActionsCompare').remove();  
                $('#_gsExtTestActions').append('<div class="_gsExtTestActionsSelect"><label>Valore da selezionare: </label> <select></select></div>'); 
                $.each($(target.target).find('option'), function() {
                    $('._gsExtTestActionsSelect select').append( $(this).clone() );
                }); 
                $('._gsExtTestActionsSelect select').off('change').on('change', function() {
                    _validators.checkActionChange(onSuccess, onFail);
                });
            },
            checkActionChange: function(onSuccess, onFail) {
                var val = $('._gsExtTestActionsSelect select').val() ,
                    statusError = 0;
                if(!val ) {
                    if(typeof(onFail) =="function") onFail();
                    statusError = 1;
                }
                else {
                    if(typeof(onSuccess) =="function") onSuccess();
                }
                return statusError;
            },
            setActionCompare: function(onSuccess, onFail) {
                $('#_gsExtTestWrite').off('keyup');
                $('._gsExtTestActionsSelect > select').off('change');
                $('._gsExtTestActionsSelect').remove();  
                $('._gsExtTestActionsWrite').remove();   
                $('#_gsExtTestActions').append(
                    '<div class="_gsExtTestActionsCompare"><label>Valore da confrontare: </label>'+
                    '<ul><li data-reg="1" class="selected" >Equal to</li>'+
                    '<li data-reg="2">Not equal to</li>'+
                    '<li data-reg="3">Contain</li>'+
                    '<li data-reg="4">End with</li>'+
                    '<li data-reg="5">Start with</li>'+ 
                    '<li data-reg="6">Greater than</li>'+ 
                    '<li data-reg="7">less than</li></ul>'+ 
                    '<input type="text" name="_gsExtTestCompare" id="_gsExtTestCompare" > <span></span></div>'
                );
                
                $('#_gsExtTestCompare').off('keyup').on('keyup', function() {
                    _validators.checkActionCompare(onSuccess, onFail);
                });
                                
                $('._gsExtTestActionsCompare').find('li').off('click').on('click',function() {
                    $('._gsExtTestActionsCompare').find('li').removeClass('selected');
                    $(this).addClass('selected');
                    _validators.checkActionCompare(onSuccess, onFail);
                });
            },
            checkActionCompare: function(onSuccess, onFail , noCheckAll) { 
                var string = $('#_gsExtTextEditQuery').find('input').val(); 
                string = $(string).filter(':visible')[0].textContent;
                var val = $('#_gsExtTestCompare').val() ; 
                var regType = $('._gsExtTestActionsCompare').find('li.selected').attr('data-reg');
                var str2 = '';
                var statusError = 0 ;
                        
                if(val.length < 1 ) {
                    if(typeof(onFail) =="function") onFail(); 
                    str2 = "<i class='red'>Valore campo non inserito per azione text compare</i>";  
                    statusError = 1;
                }
                else if(!parseInt(regType) || parseInt(regType)>7) {
                    if(typeof(onFail) =="function") onFail(); 
                    str2 = "<i class='red'>Tipologia di comparazione non selezionata</i>";  
                    statusError = 1;
                }
                else { 
                    var res = "";
                    var regex = "";
                    if(regType==1 || regType==2) {
                        //uguale || diversa
                        regex = new RegExp( "^("+val+")$", 'g' );
                        res = string.match(regex);
                    }
                    else if(regType==3) {
                        //valore contenuto nella stringa
                        regex = new RegExp( "("+val+")", 'g' );
                        res = string.match(regex);
                    }
                    else if(regType==4) {
                        //finisce per
                        regex = new RegExp( ".("+val+")$", 'g' );
                        res = string.match(regex);
                    }
                    else if(regType==5) {
                        //inizia per
                        regex = new RegExp( "^("+val+")+", 'g' );
                        res = string.match(regex);
                    }
                    else if(regType == 6 || regType == 7) {
                        // num > val || num < val
                        res = parseInt(string);
                        val = parseInt(val);
                    }
                                    
                    if(regType == 6 || regType == 7) {
                        if( isNaN(res) || isNaN(val)) {
                            if(typeof(onFail) =="function") onFail();
                            if(isNaN(res)) {
                                str2 ="Il valore inserito non è un valore numerico";
                            }
                            else {
                                str2 ="L\'elemento selezionato non rappresenta un numero";
                            }
                            str2 = "<i class='red'>"+str2+"</i>";
                            statusError = 1;
                        }
                        else if(res <= val && regType== 6) {
                            if(typeof(onFail) =="function") onFail();
                            str2 ="Il valore inserito non è maggiore del valore dell\'elemento selezionato";
                            str2 = "<i class='red'>"+str2+"</i>";
                            statusError = 1;
                        }
                        else if(res >= val && regType== 7) {
                            if(typeof(onFail) =="function") onFail();
                            str2 ="Il valore inserito non è minore del valore dell\'elemento selezionato";
                            str2 = "<i class='red'>"+str2+"</i>";
                            statusError = 1;
                        }
                        else {
                            if(typeof(onSuccess) =="function") onSuccess();
                            if(regType== 7) str2 = "<i class='green'>Check Less than ok</i>";
                            else str2 = "<i class='green'>Check Greater than ok</i>";
                        }
                    }
                    else if((res === null && regType!=2 ) || ( res !== null && regType==2)){
                        if(regType==2) {
                            if(typeof(onFail) =="function") onFail();
                            str2 ="Valore inserito trovato nell\'elemento selezionato";
                            str2 = "<i class='red'>"+str2+"</i>";
                        }
                        else {
                            if(typeof(onFail) =="function") onFail();
                            str2 ="<i class='red'>Valore inserito non trovato nell\'elemento selezionato</i>";
                        }
                        statusError = 1;
                    } 
                    else {
                        if(typeof(onSuccess) =="function") onSuccess();
                        if(regType==1) str2 = "<i class='green'>Check Equal To ok</i>";
                        else if(regType==2) str2 = "<i class='green'>Check Not Equal To ok</i>";
                        else if(regType==3) str2 = "<i class='green'>Check Contain ok</i>";
                        else if(regType==4) str2 = "<i class='green'>Check End With ok</i>";
                        else if(regType==5) str2 = "<i class='green'>Check Start With ok</i>";
                        else str2 = "<i class='green'>Check regexp ok</i>";
                    }
                }
                
                $('._gsExtTestActionsCompare').find('span').html ( str2 );
                
                if(noCheckAll === undefined || noCheckAll == "" ) {
                    _validators.checkAll();
                }
                return statusError;
            },
            checkActions: function( ) {
                var actions ='#_gsExtTestActions select:first',
                    errorStr = '';
                   
                if($(actions).val() == "write" ) {
                    _validators.setActionWrite(function() {
                        _validators.hideError("Valore campo non inserito per azione write");
                    }, 
                    function(){
                        _validators.showError("Valore campo non inserito per azione write");
                    });
                } 
                else if($(actions).val() == "select" ) {
                    _validators.setActionChange(function() {
                        _validators.hideError("Valore campo non inserito per azione select");
                    }, 
                    function(){
                        _validators.showError("Valore campo non inserito per azione select");
                    });
                } 
                else if($(actions).val() == "text comparation" ) {
                    _validators.setActionCompare(function() {
                        _validators.hideError("Valore campo non valido per azione text compare");
                    }, 
                    function(){
                        _validators.showError("Valore campo non valido per azione text compare");
                    });
                } 
                else {
                    _validators.hideError("Valore campo non inserito per azione select");
                    _validators.hideError("Valore campo non inserito per azione write");
                    _validators.hideError("Valore campo non valido per azione text compare");
                    $('#_gsExtTestWrite').off('keyup');
                    $('._gsExtTestActionsSelect select').off('change');
                    $('#_gsExtTestCompare').off('keyup');
                    $('._gsExtTestActionsSelect').remove();  
                    $('._gsExtTestActionsWrite').remove();   
                    $('._gsExtTestActionsCompare').remove();  
                }
                
                _validators.checkAll();
            }
        },
        
        // obj new test usato x creare test
        
        _newTest = {
            test: {}, //dove salvo il test azione x azione
            validAction: null, //usato x validazione form action da salvare
            init: function() {
                //eseguo dopo pulizia cookies poi apro popup creazione new test
                _cookies.clearAll(function(){ 
                    action = "newTest";
                    _newTest.test = {};
                    _modal.set('newTest');
                    _newTest.setValidators();
                    $("#_gsExtTestTitle").focus();
                });
            },
            checkResume: function() {
                //popup x confermare continuazione creazione test dopo reload pagina
                _modal.open('resumeNewTest');
            },
            resume: function() {
                //riprendo creazione test
                action = "addAction";
                //aggiorno vista
                _modal.set('addAction');
                //mostro bottombar x pointer
                _bottomBar.show();
            },
            firstAction: function() {
                //salvo titolo test e preparo tutto x step successivi
                _newTest.test.title = $('#_gsExtTestTitle').val();
                _newTest.test.url = $('#_gsExtTestUrl').val();
                _newTest.test.actions = [];
                
                //setto i cookie ...
                onCookiesUpdated = function(){  

                    action = "addAction";
                    //aggiorno vista
                    _modal.set('addAction');
                    //mostro bottombar x pointer
                    _bottomBar.show();
                    
                    //set cookies in chrome local storage to prevent lost data in case of hostname change -- altrimenti nn serve
                    if(_cookies.hostNameMatch && _cookies.hostNameMatch !== null ) {
                        _cookies.getCookies( function(){
                            _cookies.setStorageTempCookies(); 
                        } );
                    }
                    
                    console.table([_newTest.test],"title,url,actions");
                };

                if(_cookies.hostNameMatch && _cookies.hostNameMatch !== null ) {
                    cookiesUpd = [];
                    for(i in _cookies.hostNameMatch) {
                        cookiesUpd.push({url:_cookies.hostNameMatch[i]  , name:"_gsExtAction",value:"newTest"});
                        cookiesUpd.push({url:_cookies.hostNameMatch[i]  , name:"_gsExtNewTestTitle",value:$('#_gsExtTestTitle').val()});
                        cookiesUpd.push({url:_cookies.hostNameMatch[i]  , name:"_gsExtTestAction",value:"0"});
                    } 
                }
                else { 
                    cookiesUpd = [
                        {url:window.location.protocol+"//"+window.location.hostname  , name:"_gsExtAction",value:"newTest"},
                        {url:window.location.protocol+"//"+window.location.hostname  , name:"_gsExtNewTestTitle",value:$('#_gsExtTestTitle').val()} 
                    ];
                }
                
                _cookies.setCookies(cookiesUpd,onCookiesUpdated);
            },  
            setValidators: function(){
                //imposto validazione form creazione azione ogni volta che apro il popup
                _newTest.validAction = false;
                var error = false;
                //todo riscrivere validazione x questa casistica e magari iniziare dal titolo test
                if(action=='newTest') { 
                    title = '#_gsExtTestTitle';
                    submit = $('#_gsExtNewTestStart');
                    $(title).off('keyup').on('keyup', function() {
                        _validators.checkTitle(
                            function() {
                                submit.removeAttr('disabled'); 
                                _validators.hideError("Titolo troppo corto" , "noCheckAll");
                            },
                            function(){
                                submit.attr('disabled','true'); 
                                _validators.showError("Titolo troppo corto", "noCheckAll");
                            }
                        );
                    });   
                }
                else if(action=='addAction') {
                    title = '#_gsExtTestTitle';
                    scrollToElement = '#_gsExtTestScroll';
                    actions ='#_gsExtTestActions select:first';
                    submit2 = $('#_gsExtSaveTest');
                    submit = $('#_gsExtAddAction');
                    qs = '#_gsExtTextEditQuery';   
                    
                    //onload run check qs x mostrare risultato ricerca qs
                    _validators.checkQueryString();
                    
                    $(qs).find('input').off('keyup').on('keyup', function() {
                        _validators.checkQueryString(
                            function(){
                                _validators.hideError("Query string attuale non valida");
                            },
                            function(){
                                _validators.showError("Query string attuale non valida");
                            }
                        );
                    });
                    
                    $(actions).off('change').on('change', _validators.checkActions );
                    
                    $(scrollToElement).off('change').on('change', _validators.checkScrollToElement );
                    
                    $(title).off('keyup').on('keyup', function() {
                        _validators.checkTitle(
                            function() {
                                _validators.hideError("Titolo troppo corto");
                            },
                            function(){
                                _validators.showError("Titolo troppo corto");
                            });
                        }
                    );
                        
                }
            },
            saveTest: function() {
                _newTest.saveAction( 'endTest');
            },
            saveAction: function( endTest ) {
                obj = {
                    title: $('#_gsExtTestTitle').val(),
                    sleep: $('#_gsExtTestSleep').val(),
                    screenshot: $("#_gsExtTestScreenshot").val(),
                    matchString: target.matchString,
                    editMatchString: "",
                    tagName: target.tagName,
                    type: target.type,
                    action: $('#_gsExtTestActions select:first').val(),
                    url: window.location.href,
                    checkUrl: $("#_gsExtTestActionUrl").val(),
                    scrollToElement: $('#_gsExtTestScroll').val(),
                    customScrollbars: null,
                    value: "",
                    regType: ""
                }; 
                if(obj.sleep<1) obj.sleep = 1; 
                if($('#_gsExtTextEditQuery input').val() && $('#_gsExtTextEditQuery input').val() != target.matchString ){
                    obj.editMatchString= $('#_gsExtTextEditQuery input').val();
                }  
                if(obj.action == 'write') {
                    obj.value = $('#_gsExtTestWrite').val();
                    obj.regType = $('._gsExtTestActionsWrite').find('li.selected').attr('data-reg');
                }
                else if(obj.action == 'select') {
                    obj.value = $('._gsExtTestActionsSelect select').val();
                }
                else if(obj.action == "text comparation" ) {
                    obj.value = $('#_gsExtTestCompare').val();
                    obj.regType = $('._gsExtTestActionsCompare').find('li.selected').attr('data-reg');
                }
                if(obj.scrollToElement == "true") {
                    obj.customScrollbars = $('._gsExtTestScrollOptions').find('li.selected').attr('data-reg');
                }
                _newTest.test.actions.push(obj);
                  
                console.group('%c New Test: '+ _newTest.test.title +" - added new action", "font-weight:bold;");
                console.dir( obj );
                console.groupEnd();

                if(endTest!== undefined && endTest =="endTest") { 
                    _savedTestList.list.push(_newTest.test);
                    //chrome.storage.sync.set({'savedTestList':  JSON.stringify(savedTestList) }, function() {
                    chrome.storage.local.set({'savedTestList':  JSON.stringify(_savedTestList.list) }, function() {
                      // Notify that we saved.
                     // message('Settings saved'); 

                        //torno a index
                        index();
                        _modal.open();
                    });  
                }
                else {
 
                    chrome.storage.sync.set({'newTestTemp':  JSON.stringify(_newTest.test) }, function() {
                      // Notify that we saved.
                     // message('Settings saved'); 


                        if(obj.action == 'click') {
                            setTimeout(function(){  
                                //HTML DOM click() Method
                                target.target.click(); 
                                //jquery
                                //$(target.target).trigger('click'); 
                            },150);
                        }
                        if(obj.action == 'select') {
                            $(target.target).find('option').removeAttr('selected');  
                            $(target.target).find('option[value="'+obj.value+'"]')[0].selected = true;
                            $(target.target).find('option[value="'+obj.value+'"]').attr('selected','selected');
                            $(target.target).val(obj.value);
                            setTimeout(function(){ 
                                var event = document.createEvent("HTMLEvents");
								event.initEvent("change", false, true);
								//var event = new Event('change'); 
                                target.target.dispatchEvent(event); 
                                $(target.target).trigger('change');
                            },150);

                        }
                        else if(obj.action == 'write') {
                            if(obj.regType == "4") {
                                //copio valore da altro input (es utile x conferma mail)
                                $(target.target).val($(obj.value).filter(':visible').val());
                            }
                            else if(obj.regType == "3") {
                                //inserisco random mail
                                $(target.target).val(utils.randomMail());
                            }
                            else if(obj.regType == "2") {
                                //inserisco random string
                                $(target.target).val(utils.randomStr());
                            }
                            else {
                                //inserisco valore preciso inserito
                                $(target.target).val(obj.value);
                            }     
                        }

                        action = "addAction";
                        //aggiorno vista
                        _modal.set('addAction');
                    });  
                }
            }
        },
         
        // obj resizer window x run test
        
        _resizer = {
            viewports: {
                'maximized': { },
                '1280x1024': { width: 1280  +17, height: 1024 },
                '1024x768': { width: 1024, height: 768 },
                '768x1024': { width: 768  +17, height: 1024 },
                '320x480': { width: 320  , height: 480 }
            },
            maxViewport: { 
                width: $(window).width() , 
                height: $(window).height() 
            },
            checkViewportOk: true ,
            newVp: {},
            lastVp: {},
            resizeWindow: function( vp , actualVp ) {
                chrome.runtime.sendMessage({greeting: "getResizeWindow" , vp: vp , actualVp: actualVp }, function(response) {
                    //console.log(response.farewell); 
                });   
            },
            resizeWindowAtViewport: function( vp ) {
           
                //check maxViewport
                if(vp.width > _resizer.maxViewport.width) vp.width = _resizer.maxViewport.width;
                if(vp.height > _resizer.maxViewport.height) vp.height = _resizer.maxViewport.height; 

                actualVp = { width: parseInt($(window).width()) , height:parseInt($(window).height()) };
                
                console.table([ _resizer.maxViewport , actualVp , vp]);
                
                _resizer.resizeWindow( vp , actualVp );
            },
            checkSelectedViewport: function( requestVp ) {
                if(_runTest.test.selectedViewport != "maximized") { 
                    actualVp = { width: parseInt($(window).width()) , height:parseInt($(window).height()) };
                    _resizer.newVp = { width:parseInt(requestVp.width) , height:parseInt(requestVp.height) };
                    //check x aggiustare tutto
                    _resizer.checkViewportOk = true;
                    if(actualVp.width > _resizer.viewports[_runTest.test.selectedViewport].width ) {
                        _resizer.newVp.width = _resizer.newVp.width - 1 ;
                        _resizer.checkViewportOk = false;
                    }
                    else if(actualVp.width < _resizer.viewports[_runTest.test.selectedViewport].width ) {
                        _resizer.newVp.width = _resizer.newVp.width + 1 ;
                        _resizer.checkViewportOk = false;
                    } 
                    
                    if(actualVp.height > _resizer.viewports[_runTest.test.selectedViewport].height ) {
                        _resizer.newVp.height = _resizer.newVp.height - 1 ;
                        _resizer.checkViewportOk = false;
                    }
                    else if(actualVp.height < _resizer.viewports[_runTest.test.selectedViewport].height ) {
                        _resizer.newVp.height = _resizer.newVp.height + 1 ;
                        _resizer.checkViewportOk = false;
                    } 
                }
                else {
                    _resizer.checkViewportOk = true;
                }
                    
                    //check maxViewport
                    //if((actualVp.width+1) > maxViewport.width) newVp.width = maxViewport.width;
                    //if((actualVp.height+1) > maxViewport.height) newVp.height = maxViewport.height; 
            
                if(_resizer.checkViewportOk === false) { 
                        //se vp new è uguale a vecchio vuol dire che ho raggiunto il massimo espandibile ... forzo resizeOK
                    if(_resizer.lastVp.width == _resizer.newVp.width && _resizer.lastVp.height == _resizer.newVp.height) {
                        $(window).trigger('windowResized'); 
                    }
                    else {
                        _resizer.lastVp = utils.cloneObj(_resizer.newVp);
                        _resizer.resizeWindowAtViewport( _resizer.newVp );
                    }
                    //sendResponse({farewell: "thankyou"});
                }
                else {
                    //ok viewport!
                    //sendResponse({farewell: "thankyou"});
                    $(window).trigger('windowResized'); 
                }
            },
            maximizeWindow: function () {
                //check x ottenre max width ed height applicabili a chrome 
                var updMaxvp = function() {
                    _resizer.maxViewport.width = $(window).width();
                    _resizer.maxViewport.height = $(window).height(); 
                    console.log("%c Set max viewport " +_resizer.maxViewport.width + "x"+_resizer.maxViewport.height , "font-weight:bold;");
                    clearTimeout(forceCalc);
                    $(window).off('resize', updMaxvp );
                }
                $(window).on('resize', updMaxvp );
                var forceCalc = setTimeout(updMaxvp,1000);
                chrome.runtime.sendMessage({greeting: "getResizeWindowMax" }, function(response) {
                    //console.log(response.farewell);   
                });    
            }
        },
        
        // obj edit settings
        
        _settings = {
            list: {
                localPath:'',
                notifications: ''
            },
            index: function() {
                
                //eseguo dopo pulizia cookies poi apro popup creazione new test
                _cookies.clearAll(function(){ 
                    action = "editSettings"; 
                    _modal.set('editSettings');
                });
            },
            save: function() {
                var obj = {
                    localPath: $('#_gsExtLocalPath').val(),
                    notifications: $('#_gsExtNotifications').val() 
                }; 
                 
                console.table(obj);
                chrome.storage.sync.set({'settings':  JSON.stringify(obj) }, function() {
                    _settings.list = obj;
                    //torno a index
                    index();
                    _modal.open();
                });
            }
        },
        
        //lister chiamate chrome usati dai vari oggetti 
        
        initChromeListeners = function (){;
            chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) { 
                console.log (request.greeting); 
                if (request.greeting == "cookies") { 
                    //salvo i cookies in locale 
                    _cookies.list = request.cookies; 
                    console.log (_cookies.list ); 
                    console.table (_cookies.list,["domain","name","value"]); 
                    $(window).trigger('cookiesLoaded');  
                }
                else if (request.greeting == "clearCookies") { 
                    //salvo i cookies in locale 
                    _cookies.list = request.cookies; 
                    console.log (_cookies.list ); 
                    console.table (_cookies.list,["domain","name","value"]); 
                    $(window).trigger('cookiesClearLoaded');  
                }
                else if (request.greeting == "cookiesUpdated") { 
                    //salvo i cookies in locale 
                    _cookies.list = request.cookies; 
                    console.log (_cookies.list ); 
                    console.table (_cookies.list,["domain","name","value"]);  
                    $(window).trigger('cookiesUpdateLoaded');  
                }
                else if (request.greeting == "screenshotPartial") { 
                    clearTimeout(timer);
                    if(action=="runTest") {
                        //attacht screenshot to report
                        name = "A"+idAction+"T"+idTest+" - screenshot.png"; 
                        if(idSequence!== undefined && idSequence!==null) {
                            name = "S"+idSequence+name;
                            name2="A"+idAction+"T"+idTest+".png";
                        }
                        else {
                            name2="A"+idAction+".png";
                        }
                        _report.updateImages( name , request.data ); 
                        _report.update("<img src='"+name2+"' class=\"thumbnail\"  style='vertical-align:top;max-width:640px' >");
                        _report.update("<img src='DIFF_"+name2+"' class=\"thumbnail\"  style='vertical-align:top;max-width:640px' >");    
                    }
                    //go next step
                    $(window).trigger('screenshotPartial');
                }
                else if (request.greeting == "screenshot") { 
                    clearTimeout(timer);
                    if(action=="runTest") {
                        //attacht screenshot to report
                        name = "T"+idTest+" - screenshot.png"; 
                        name2="T"+idTest+".png";
                        if(idSequence!== undefined && idSequence!==null) {
                            name = "S"+idSequence+name;
                        }
                        _report.updateImages( name , request.data ); 
                        _report.update("<img src='"+name2+"' class=\"thumbnail\"  style='vertical-align:top;max-width:640px' >");     
                        _report.update("<img src='DIFF_"+name2+"' class=\"thumbnail\"  style='vertical-align:top;max-width:640px' >");   
                        _report.download();
                        //check sequence
                    }
                    $(window).trigger('screenshot');
                }
                else if (request.greeting == "resizeWindow") {
                    setTimeout(function(){
                        _resizer.checkSelectedViewport( request.vp ); 
                    }, 200);
                }
            });
        },
        
        initListeners = function() {
            //click su popup modal
            $(document).on('click', '#_gsExtNewSequence' , _savedTestList.newSequenceDialog );
            $(document).on('click', '#_gsExtSaveSequence' , _savedTestList.saveSequence );
            $(document).on('click', '#_gsExtSettings' , _settings.index );
            $(document).on('click', '#_gsExtSaveSettings' , _settings.save );
            $(document).on('click', '#_gsExtArchive' , function() {
                //window.open(_settings.list.localPath, '_blank');
                var localUlr = _settings.list.localPath.split('///')[1];
                //localUlr = localUlr.split(':/')[1];
                window.location.href = 'http://localhost/'+localUlr.split(':/')[1];
            });
            
            $(document).on('click', '#_gsExtRunTestDownload', _savedTestList.export );
            $(document).on('click', '#_gsExtRunTestUpload', _savedTestList.uploadDialog );
            $(document).on('click', '#_gsExtUpload ', function() {
                _savedTestList.import(function(){index(); _modal.open();});
            });
            $(document).on('click', '#_gsExtRunTest' , _savedTestList.selectDialog );
            $(document).on('click', '#_gsExtRunTestStart' , _runTest.init );
            $(document).on('click','#_gsExtRunSequence' , _savedTestList.selectSequenceDialog );
            $(document).on('click','#_gsExtRunSequenceStart' , _runTest.initSequence );
            
            $(document).on('click', '#_gsExtNewBack' , index );
            $(document).on('click', '#_gsExtNewTest' , _newTest.init );
            $(document).on('click', '#_gsExtNewTestStart' , _newTest.firstAction );
            $(document).on('click', '#_gsExtNewTestResume' , _newTest.resume );
            $(document).on('click', '#_gsExtAddAction' , _newTest.saveAction );
            $(document).on('click', '.effeckt-modal-close', _modal.close);  
            $(document).on('click', '#_gsExtSaveTest', _newTest.saveTest);
            $(document).on('click', '#_gsExtRunTestClear' , clearAll );
            $(document).on('change','#_gsExtTestViewport' , function(){
                _runTest.test.selectedViewport = $(this).val();
                _resizer.resizeWindowAtViewport(_resizer.viewports[$(this).val()]);
            });
            
             
            
            //right click
            $(document).on("contextmenu", function(e) {
                e.preventDefault();  
                console.info(e);  
                console.info(action);
                if( (action=="addAction") && _modal.isOpen === false && $(e.target) !== _bottomBar.target ) {
                    detectTarget(e);
                }  
                if(_modal.isOpen === false) {
                    _modal.open(action); 
                    if(action=="addAction" ) {
                        $("#_gsExtTestTitle").focus();  
                        _newTest.setValidators();
                    }
                }
            }); 
            
            //update dom inspectior results
            $(document).on('mousemove',_bottomBar.update);
            
            //highlights selected dom to inspect
            $('body').mouseover(function(event) {
                if((action=="addAction" ) && _modal.isOpen === false && $(event.target) !== _bottomBar.target ) {
                    $(event.target).addClass('outline-element');
                }
            }).mouseout(function(event) {
                $(event.target).removeClass('outline-element');
            });
            
            //focus on input 
            /*function focusInHandler(event){
                Event.element(event).fire("focus:in");
            }
            function focusOutHandler(event){
                Event.element(event).fire("focus:out");
            }

            document.getElementById("myAnchor").focus();
            if (document.addEventListener){
                document.addEventListener("focus", focusInHandler, true);
                document.addEventListener("blur", focusOutHandler, true);
            } else {
                document.observe("focusin", focusInHandler);
                document.observe("focusout", focusOutHandler);
            }

            document.observe('focus:in', function(event) {
                console.log('focus:in');
            });

            document.observe('focus:in', function(event) {
                console.log('focus:out');
            });*/
        },
            
        init = function() { 
            _modal.init();
            initListeners();
            initChromeListeners();
            
            onCookiesLoaded = function(){ 
                
                if(_cookies.tempCookies && _cookies.tempCookies !== null && _cookies.hostNameMatch && _cookies.hostNameMatch !== null && _cookies.hostNameMatch[0].replace(/.*?:\/\//g, "") != window.location.hostname ) {
                    //mi trovo in hostName associato a hostNameMatch (es. sono in http di un sito http 
                    //se sono in runTest devo ripristinare test prendendo valori da tempCookies
                    for(i in _cookies.tempCookies) {
                        //x il check cookies devo passare domains senza http e https
                        if( _cookies.tempCookies[i].name == '_gsExtAction' ) {
                            action= _cookies.tempCookies[i].value;
                        }
                        else if( _cookies.tempCookies[i].name == '_gsExtTest' ) {
                            idTest= _cookies.tempCookies[i].value;
                        }
                        else if( _cookies.tempCookies[i].name == '_gsExtTestAction' ) {
                            idAction= _cookies.tempCookies[i].value;
                        }
                        else if( _cookies.tempCookies[i].name == '_gsExtTestSequence' ) {
                            idSequence= _cookies.tempCookies[i].value;
                        }
                        else if( _cookies.tempCookies[i].name == '_gsExtTestSequencePosition' ) {
                            currentSequencePos= _cookies.tempCookies[i].value;
                        } 
                    } 
                    console.log('cookies from temp = ' + action + ' SEQUENCE: '+ idSequence + ' POS: ' + currentSequencePos + ' TEST:' + idTest + ' ACTION:' + idAction);
                }
                else {
                    //get cookie normale
                    action= _cookies.getCookie("_gsExtAction");
                    idTest = _cookies.getCookie("_gsExtTest"); 
                    idAction = _cookies.getCookie("_gsExtTestAction");  
                    idSequence = _cookies.getCookie("_gsExtTestSequence");  
                    currentSequencePos = _cookies.getCookie("_gsExtTestSequencePosition");  
                    console.log('cookies= ' + action + ' SEQUENCE: '+ idSequence + ' POS: ' + currentSequencePos + ' TEST:' + idTest + ' ACTION:' + idAction);
                }
                
                if( idTest !== undefined && idTest !== "" && parseInt(idTest) >= 0  && action =="runTest" ) {
                    //console.log(action + ' ' + idTest + ' ' + idAction);
                    //get temp report
                    chrome.storage.local.get(['reportTemp'], function(data) {   
                        if(data) {
                            _report.data = JSON.parse(data.reportTemp);  
                            setTimeout(function(){
                                if(!idAction) idAction = "0";
                                 
                                _runTest.test = utils.cloneObj(_savedTestList.list[idTest]);   
                                
                                if(idAction == "0" && utils.getDomain(_runTest.test.url) != window.location.hostname ) {
                                    //run test in domain errato !?
                                    _runTest.test = null;
                                    console.warn('run test in wrong domain');
                                }
                                
                                console.log(_runTest.test);
                                _bottomBar.init();
                                if(_runTest.test) {
                                    _bottomBar.hide();
                                    _runTest.run();
                                }
                                else{
                                    //test non trovato
                                    _resizer.maximizeWindow();  
                                    _modal.open();
                                }
                            },500);    
                        }  
                        else{
                            //test non recuperato
                            _resizer.maximizeWindow();  
                            _modal.open();
                        }
                    });
                }
                else if (action=="newTest") {
                    _bottomBar.init();
                    _bottomBar.hide();
                    //recupero dati della creazione test in corso
                    chrome.storage.sync.get(['newTestTemp'], function(data) { 
                        var err=1;
                        if(data && data.newTestTemp ) {
                            _newTest.test = JSON.parse(data.newTestTemp);
                            if( _newTest.test.actions ) {
                                //$(window).trigger('newTestResumed');  
                                _newTest.checkResume();
                                console.info(_newTest.test);
                                console.info(action);
                                err = 0;
                            }
                        }
                        if(err==1) {
                            //clear cookies nel caso ho doppi cookie.. casistica index 
                            _cookies.clearAll();
                            _resizer.maximizeWindow();
                            _bottomBar.init();
                            _modal.open();
                        }
                    });
                    
                }
                else {
                    //clear cookies e pulizia var tmp .. casistica index 
                    chrome.storage.local.set({'reportTemp':  JSON.stringify([]) }, function() { });    
                    chrome.storage.sync.set({'newTestTemp':  JSON.stringify([]) }, function() { });   
                    _cookies.clearAll( function(){
                        _resizer.maximizeWindow();
                        _bottomBar.init();
                        _modal.open();
                    });
                }
                
            }; 
            
            //get cookies temp
            _cookies.getStorageTempCookies(); 
            //get cookies
            setTimeout(function(){
                _cookies.getCookies( onCookiesLoaded ); 
            },150);
              
            //load lista test salvati e settings
            chrome.storage.sync.get(['settings'], function(data) { 
                if( data && data.settings) {
                    _settings.list = JSON.parse(data.settings);
                    console.log(_settings.list);
                }
                $(window).trigger('settingsLoaded');
            }); 
            //chrome.storage.sync.get(['savedTestList'], function(data) { 
            chrome.storage.local.get(['savedTestList','savedSequenceList'], function(data) { 
                if(data && data.savedTestList) {
                    _savedTestList.list = JSON.parse(data.savedTestList);
                    console.table(_savedTestList.list);
                    if(data.savedSequenceList) {
                        _savedTestList.sequencesList = JSON.parse(data.savedSequenceList);
                        console.table(_savedTestList.sequencesList);
                    }
                    $(window).trigger('storageLoaded'); 
                } 
            }); 
            //clearAll(); //da lanciare se voglio pulire storage e cookies forzatamente
        };
        
    init();
};

$(document).ready(function() { 
    gsExt();
});


/* 
routines / test sequences
images hystory compare !!! serve gestione cartella download x check history
*/