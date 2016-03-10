//******************
//Global Variables:
//*******************
//Change the following line to the EprHttpServer's IP address and the port:
var WEAVER_SERVER  = "http://127.0.0.1:8000/"
//var WEAVER_SERVER  = "http://192.168.13.249:8000/"
//var WEAVER_SERVER = "http://azureuser@produvia-lab.cloudapp.net:80/";
//var WEAVER_SERVER = "http://23.96.27.238/";

var dbg = false;

var MINUTES_SINCE_LAST_SEEN_TO_BE_CONSIDERED_ONLINE = 1;
var AUTH_TOKEN = null;
var TOTAL_SERVICES_DISCOVERED = 0;

var currentLoginService = null;
var currentResponseData = null;

var SPINNING = false;
var TIMEOUT_TO_GET_SERVICES = 60;

//************************************
// DEMO:
//************************************
var demomode = false;
var whos_home = {};
///IF NOT DEMOMODE SHOULD BE FALSE:
var handle_noone_home = demomode;
var motionState = null;
var motionSensorService = null;
//************************************

var mIotServices = {};
var noLightServicesAppended = true;

//************************************
//who's home globals:
//************************************
var handledSomeoneHome = false;
var handledNooneHome = false;
var ALARM_STATUS = false;

//************************************
//color constants:
//************************************
var RED = {h:0, s:1, b:1};
var GREEN = {h:120, s:1, b:1};
var COLORS = [RED,GREEN];




//*****************************
// Helper functions:
//*****************************
function print(str){
  if(dbg)
    console.log(str);
}


function stringStartsWith(string, prefix) {
    if(string == null)
      return false;
    return string.slice(0, prefix.length) == prefix;
}
function stringEndsWith (string, suffix) {
    return suffix == '' || string.slice(-suffix.length) == suffix;
}

function writeToLocalStorage(key, value){
  if(typeof(Storage) !== "undefined") {
      localStorage.setItem(key, value);
  } 
}

function readFromLocalStorage(key){
  if(typeof(Storage) !== "undefined") {
      return localStorage.getItem(key);
  } else {
      return null;
  }
}

function removeFromLocalStorage(key){
  if(typeof(Storage) !== "undefined")
    localStorage.removeItem(key);
}

function isEmail(email) {
  var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  return regex.test(email);
}

function showSpinner(){
  if(SPINNING)
    return;
  SPINNING = true;
  print("spinner show");
//  if($("#spinner").is(":visible") )
//    return;
  print("showing");
  $("#spinner").show();
  var angle = 0;
  var spinner_interval = setInterval(function(){
    if($("#spinner").is(":visible")  == false)
      clearInterval(spinner_interval);
    angle+=9;
    $("#spinner").rotate({"angle":angle});
  },50);
}

function hideSpinner(){
  if(!SPINNING)
    return;
  SPINNING = false;   
  $("#spinner").hide();
}


//************************************
// WeaverServer Operations:
//************************************
function doWeaverOp(path, json, callback, next_function_call){

  headers = {};
  if( AUTH_TOKEN != null ){
    headers = { "Authorization": "Bearer " +  AUTH_TOKEN }
  }

  $.ajax({
      type: "POST",
      url: WEAVER_SERVER + path,
      headers: headers,
      data: JSON.stringify(json),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      crossDomain: true,

      success: function(data){
        print(JSON.stringify(data));
        if(data.success == false)
          errorCallback(data);
        else if(callback != null )
          callback(data, next_function_call);

      },
      failure: function(errMsg) {
          errorCallback(errMsg);
      }
  });
}


function errorCallback(error_json){

  if(error_json.info == "unauthorized" ){
    Cookies.remove("auth");
    removeFromLocalStorage("auth");
    AUTH_TOKEN = null;
    $("#login-register-box").show();
    return;
  }


  hideSpinner();
  $("#modal-title").html("<h3>Error Processing Request</h3>");
  $("#modal-text").html("<p>" + error_json.info +"</p>");
  window.location.href = '#openModal';

}

//************************************
// Register Login Ops:
//************************************
function WeaverRegisterUser(email, regpass, reregpass){
  var json = {};
  json.email = email;
  json.username = "no-username";
  json.password = regpass;
  doWeaverOp("register", json, onLoggedIn, WeaverInit);
}

function WeaverLoginUser(email, regpass, reregpass){
  var json = {};
  json.email = email;
  json.password = regpass;
  doWeaverOp("login", json, onLoggedIn, WeaverInit);
}


//************************************
// Init Server:
//************************************
function WeaverInit(){
  var json = {};
  doWeaverOp( "init", json, onInitialized );
}

//************************************
// Lab Demo:
//************************************
function WeaverLabDemoMode(enable){
  var json = {"enable":enable};
  doWeaverOp( "demomode", json, onLabDemoModeEnableDisable );
}
//************************************
// Scan for services:
//************************************
function WeaverScan(op){
  var json = {"operation":op};
  doWeaverOp( "scan", json, onScanning );
}

//************************************
// Get discovered services:
//************************************
function WeaverGetServices(){
  var json = {};
  doWeaverOp( "services_get", json, onServicesGet );
}

//************************************
// Modify & Control services:
//************************************
function WeaverSetServices(json, callback){
  print(JSON.stringify(json));
  doWeaverOp( "services_set", json, callback );
}


function WeaverUpdateServices(json, callback){
  print(JSON.stringify(json));
  doWeaverOp( "services_update", json, callback );
}


//************************************
//* WeaverServer callbacks:
//************************************

function onLoggedIn(json, next_function_call){
  //grab the auth token and save it for the next calls:
  
  AUTH_TOKEN = json.data.auth_token;
  Cookies.set("auth", AUTH_TOKEN);
  writeToLocalStorage("auth", AUTH_TOKEN);
  if(next_function_call != null){
    next_function_call();
  }
  $("#login-register-box").hide();
  showSpinner();
}

function onInitialized(json){
  AUTH_TOKEN = json.data.auth_token;
  Cookies.set("auth", AUTH_TOKEN);
  writeToLocalStorage("auth", AUTH_TOKEN );
  $("#login-register-box").hide();
  //start scan and get services:
  showSpinner();
  //$("#demo-toggle-container").show()
  //try to get the services found in previous scans:
  WeaverScan("start");   
  WeaverGetServices();  
  
}


function onLabDemoModeEnableDisable(){
  WeaverScan("stop"); 
  //remove the services cards:  
  mIotServices = {};
  $(".lights-area").empty();
  showSpinner();
  WeaverScan("start");   
  WeaverGetServices();
 
}


function onScanning(json){
  

  setTimeout(function(){
    WeaverScan("info");
    TIMEOUT_TO_GET_SERVICES -= 1;
  }, 1000);

  ///////////////////////////////////////////////////////
  //DEMO:
  if( demomode && json.hasOwnProperty("whos_home_demo") ) {
    var whos_home_tmp = json.whos_home_demo;
    print("whos_home: " + JSON.stringify(whos_home_tmp));


    var diff = false;
    online_mobiles = [];
    $.each(whos_home_tmp, function(k, v) {
       //display the key and value pair
        if(v == true){
          online_mobiles.push(k);
          if( whos_home[k] == null || whos_home[k] == false ){
            //flash welcome message!!!!!!!<<<<<<<<<<<<<<<<<<<<<
            verifyNewcommer(k);
          }

        }
        if( whos_home[k] != v )
          diff = true;
    });


    if(diff) {

      whos_home = whos_home_tmp;

      var mobiles = "";
      $("#whos-home").html("");

      if(online_mobiles.length == 0){
        //if noone is home and the lights are on - offer to turn them off:
        if(handle_noone_home)
          handleNooneHome();
      } else {
        
        for(var i = 0; i < online_mobiles.length; i++) {
          mobiles += online_mobiles[i] + " ";
          appendMobileDevice(online_mobiles[i]);
        }
        print(mobiles);
        handleSomeoneGotHome(mobiles);
      }
      $("#notif").attr("data-badge", online_mobiles.length);

    }
  }
  ////////////////////////////////////////////////////////

  //ok a service was discovered - so we'll add it:
  if( json.count <= 0 )
    return;

  var get_devices = false;
  if( TIMEOUT_TO_GET_SERVICES <= 0 ){
    TIMEOUT_TO_GET_SERVICES = 60;
    if(!demomode )
      handle_noone_home = true;
    get_devices = true;
  }
  
  if(json.count > TOTAL_SERVICES_DISCOVERED || get_devices ){
    TOTAL_SERVICES_DISCOVERED = json.count;
    WeaverGetServices();
  }


}



function onServicesGet(json){
  //check if any mobiles are inside the network:
  devices_info = json.data.devices_info

  
  var now = new Date();
  var second = 1000;

  online_mobiles = [];
  offline_mobiles = [];

  min_diff = null;
  last_seen_mobile = null;

  $.each(devices_info, function(id, device) {
    //display the key and value pair

    //check to see if there's an online mobile:
    if(device.type != null && device.type.toLowerCase().indexOf("mobile") >= 0 ){
      print(JSON.stringify(device));
      var last_seen = new Date(device.last_seen);
      var diff = Math.ceil((now.getTime()-last_seen.getTime())/(second))

      if(min_diff == null || min_diff > diff ){

        min_diff = diff;
        last_seen_mobile = device;
      }

      print(diff);
      if(diff < 60*MINUTES_SINCE_LAST_SEEN_TO_BE_CONSIDERED_ONLINE){
        print("ONLINE: " + JSON.stringify(device));  
        online_mobiles.push(device);
      }else {
        print("OFFLINE: " + JSON.stringify(device));  
        offline_mobiles.push(device);
      }
    }
  });


  if(!demomode) {
    var mobiles = "";
    $("#whos-home").html("");

    if(online_mobiles.length == 0){
      if(last_seen_mobile != null )
        print("noone home " + last_seen_mobile.manufacturer + " " + last_seen_mobile.name + " was last seen "+ Math.ceil(min_diff/60) + " minutes ago") ;
      else
        print("noone home ");
      //if noone is home and the lights are on - offer to turn them off:
      if(handle_noone_home)
        handleNooneHome();
    } else {
      
      for(var i = 0; i < online_mobiles.length; i++) {
        mobiles += online_mobiles[i].name + " ";
        appendMobileDevice(online_mobiles[i]);
      }
      print(mobiles);
      handleSomeoneGotHome();
      
    }
    $("#notif").attr("data-badge", online_mobiles.length);
  }
  handleReceivedServices(json.data);
    
}



//*******************************************
// WeaverServer Callback helper functions:
//*******************************************
function isLightService(service){
  return stringStartsWith(service.service, "_light_color" );
}

function isSensorService(service){
  return stringStartsWith(service.service, "_sensor_generic" );
}

function handleReceivedServices(data) {

    services = data.services;
    for (var i = 0; i < services.length; i++) {
        service = services[i];
        service_type = service.service;


        if (service_type == "login") {
          promptLogin(service, data);
        }
        else if( isLightService(service)|| isSensorService(service) ) {
            //yey! got a light_color service - let's add it to the list:
            addIotService(service,
                    data.devices_info[service.device_id],
                    data.networks_info[service.network_id], 
                    service_type);
        }


    }

}

function isGlobal(service) {
  return stringEndsWith(service.service, ".global");
}

function getServiceType( service){
  return service.service;
}

function getId(service) {
  return service.id;
}

function getDeviceId(service) {
  return service.device_id;
}


function servicesEqual(s1, s2){
  return (isGlobal(s1) == isGlobal(s2)&&
          getServiceType(s1) == getServiceType(s2) &&
          getId(s1) == getId(s2) &&
          getDeviceId(s1) == getDeviceId(s2));
}

//******************************************************
// Helper function: builds a full service json 
//     (connecting  its network and device information)
//******************************************************
function buildServiceJson(service){
  db_id = service.db_id;

  print(db_id);
  print(service);
  print(JSON.stringify(mIotServices[db_id]));
  device = mIotServices[db_id].device;
  network = mIotServices[db_id].network;

  devices_info = {};
  devices_info[service.device_id] = device;
  networks_info= {};
  networks_info[service.network_id] = network;

  print("service: " + JSON.stringify(service) );
  print("device: " + JSON.stringify(device) );
  print("network: " + JSON.stringify(network) );

  print(JSON.stringify({"services":[service], "devices_info": devices_info, "networks_info": networks_info}));
  return {"services":[service], "devices_info": devices_info, "networks_info": networks_info};
}


//*****************************
// UI functions:
//*****************************

//*****************************
// Register Login:
//*****************************
$(function() {
   $(".input input").focus(function() {

      $(this).parent(".input").each(function() {
         $("label", this).css({
            "line-height": "18px",
            "font-size": "18px",
            "font-weight": "100",
            "top": "0px"
         })
         $(".spin", this).css({
            "width": "100%"
         })
      });
   }).blur(function() {
      $(".spin").css({
         "width": "0px"
      })
      if ($(this).val() == "") {
         $(this).parent(".input").each(function() {
            $("label", this).css({
               "line-height": "60px",
               "font-size": "24px",
               "font-weight": "300",
               "top": "10px"
            })
         });

      }
   });

   $(".login-register-button").click(function(e) {
      var pX = e.pageX,
         pY = e.pageY,
         oX = parseInt($(this).offset().left),
         oY = parseInt($(this).offset().top);

      $(this).append('<span class="click-efect x-' + oX + ' y-' + oY + '" style="margin-left:' + (pX - oX) + 'px;margin-top:' + (pY - oY) + 'px;"></span>')
      $('.x-' + oX + '.y-' + oY + '').animate({
         "width": "500px",
         "height": "500px",
         "top": "-250px",
         "left": "-250px",

      }, 600);
      $("button", this).addClass('active');

      if($(this).attr('id')=="register-button"){
        //get the input and register:
        var email = $("#regname").val();
        var regpass = $("#regpass").val();
        var reregpass = $("#reregpass").val();
        if( !isEmail(email) ){
          $("#modal-title").html("<h3>Invalid Email</h3>");
          $("#modal-text").html("<p>Please check your email address and try again</p>");
          window.location.href = '#openModal';
          return;
        } else if(regpass != reregpass){
          $("#modal-title").html("<h3>Passwords Don't Match</h3>");
          $("#modal-text").html("<p>Please retype your password and try again</p>");
          window.location.href = '#openModal';
          return;
        } else if(regpass.length < 8){
          $("#modal-title").html("<h3>Passwords Length</h3>");
          $("#modal-text").html("<p>Passwords must be at least 8 characters</p>");
          window.location.href = '#openModal';
          return;
        } else {//great register the user:
          WeaverRegisterUser(email, regpass, reregpass);
        }

      } else {
        //grab the input and login
        var email = $("#name").val();
        var pass = $("#pass").val();
        if( !isEmail(email) ){
          $("#modal-title").html("<h3>Invalid Email</h3>");
          $("#modal-text").html("<p>Please check your email address and try again</p>");
          window.location.href = '#openModal';
          return;
        } else {
          WeaverLoginUser(email, pass);
        }
        
      }

   })


   $("#register-login-toggle").click(function() {

      if ($(this).hasClass('login-mode')) {
         setTimeout(function() {
            $(".overbox").css({
               "overflow": "hidden"
            })
            $(".box").addClass("back");
         }, 200)
         $(this).addClass('active').animate({
            "width": "700px",
            "height": "700px"
         });

         setTimeout(function() {
            $(".shape").css({
               "width": "50%",
               "height": "50%",
               "transform": "rotate(45deg)"
            })

            $(".overbox .title").fadeIn(300);
            $(".overbox .input").fadeIn(300);
            $(".overbox .login-register-button").fadeIn(300);
         }, 700)

         $(this).removeClass('login-mode');

      } else {
         $(".shape").css({
            "width": "100%",
            "height": "100%",
            "transform": "rotate(0deg)"
         })

         setTimeout(function() {
            $(".overbox").css({
               "overflow": "initial"
            })
         }, 600)

         $(this).animate({
            "width": "140px",
            "height": "140px"
         }, 500, function() {
            $(".box").removeClass("back");

            $(this).removeClass('active')
         });

         $(".overbox .title").fadeOut(300);
         $(".overbox .input").fadeOut(300);
         $(".overbox .login-register-button").fadeOut(300);

         $("#register-login-toggle").addClass('login-mode');
      
      }
   });

});




function promptLogin(loginService, responseData) {

  var FIRST_LOGIN_TYPE_NORMAL      = "normal";
  var FIRST_LOGIN_TYPE_KEY = "key";
  var FIRST_LOGIN_TYPE_PRESS2LOGIN = "press2login";


  var type = loginService.type;
  //there was a login error. login again
  if (type == FIRST_LOGIN_TYPE_NORMAL) {
    //prompt for username and password and retry:
    promptUsernamePassword(loginService, responseData, false, null);
  } else if(type == FIRST_LOGIN_TYPE_KEY) {
      return;
      //promptUsernamePassword(loginService, responseData, true, loginService..description);
  }
  else if (type == FIRST_LOGIN_TYPE_PRESS2LOGIN) {
      //prompt for username and password and retry:
      var countdown = loginService.hasOwnProperty("login_timeout")? loginService.login_timeout: 15;

      $("#modal-title").html("<h3>" + loginService.description + "</h3>");
      window.location.href = '#openModal';
      countDown(countdown, loginService, responseData);
  }

}





function promptUsernamePassword(loginService, responseData, isKey, description){

  //if it's a key type input hide the password field:
  if(isKey) {
      /*passInput.setVisibility(View.GONE);
      userInput.setText(loginService.getJSONObject("properties").getString("key"));
      userInput.setHint("Enter key");*/
  } 

  


  name = responseData.devices_info[loginService.device_id].name;

  var message = "";
  if(description == null) {
      message = "Enter " +
              name + "'s username and password.";
  }else{
      message = description;
  }
  $("#login-title").html("<h3>" + message +"</h3>");
  $("#login-text").html("<p></p>");
  currentLoginService = loginService;
  currentResponseData = responseData;
  window.location.href = '#loginModal';
}

function onSetLoginService(){
  window.location.href = '#close';
  // set dialog message
  loginService = currentLoginService;
  responseData = currentResponseData;

  username = $("#login_uname").val();
  password = $("#login_pass").val();
  //  if (isKey) {
  //    loginService.getJSONObject("properties").put("key", username);

  //} else {
      loginService.properties.username = username;
      loginService.properties.password = password;
  //}
  //stick the service into the response data structure and set the service:
  services = [loginService];
  responseData.services =  services;
  WeaverSetServices(responseData, onLoggedInToDevice);
}


function countDown(countdown, loginService, responseData){

  $("#modal-text").html("<p>"+loginService.description + "\n" + "Attempting to login again in " + countdown + " seconds...</p>");
  if(countdown > 0 ) {
    setTimeout(function(){
      countDown(countdown-1, loginService, responseData)
    }, 1000);
  } else {
    //close the dialog and login:

    window.location.href = '#close';
    services = [loginService];
    responseData.services = services;
    WeaverSetServices(responseData, onLoggedInToDevice);
  }
}

function onLoggedInToDevice(json){
  //remove a service as the login was either a success or in order to get it again:
  TOTAL_SERVICES_DISCOVERED--;
}

//********************************
// Adds a service to the UI
//********************************
function addIotService( service,  device,  network, service_type)  {

    //if the service is local but the user isn't inside the network - they can't use  it
    // so we won't add it to the list.
    //if it's a global service - it can be used from anywhere and will be added:
    is_user_inside_network = network.user_inside_network;
    is_global = isGlobal(service);
    if( !is_user_inside_network && !is_global )
        return;
    //also if this is a global service that has an identical local service and the user is inside
    //the network - we'll prefer the local service:
    //make sure the service isn't already in the list:
    lcs = mIotServices[service.db_id];
    if(lcs != null)
      lcs = lcs.service
    if(lcs != null && servicesEqual(service, lcs))
        return;
  
  
    //fill the list:
    network_name = network.name;
    found_lights_in_network = (mIotServices.length  > 0);
    
    mIotServices[service.db_id] = {"service":service,"device":device, "network":network};

    //display the new light service:
    displayService(service, device, network, service_type);

    print("mIotServices: " + JSON.stringify(mIotServices));
}





//********************************
// Displays a service (UI)
//********************************
function displayService(service, device, network, service_type){

  hideSpinner();  
  print(JSON.stringify(service));


  if( isLightService(service) )
    appendLightStructure(service, device.iot_device);
  else if(isSensorService(service) )
    appendGenericSensor(service, device.iot_device);
}

function appendLightStructure(service, device_type){

  checked = "";
  if(service.properties.power.on)
    checked = "checked";
  initial_color = {h:(service.properties.color.hue/360), s:service.properties.color.sat, v:service.properties.color.bri, a:1};
  rgb = colorToStr( hsb2Rgb(
          {h:service.properties.color.hue, 
           s:service.properties.color.sat, 
           b:service.properties.color.bri}) );


  if(noLightServicesAppended) {
    noLightServicesAppended = false;
    //add a master switch:
    $(".lights-area").append(
      "<div class=\"mdl-card mdl-card-light-color mdl-cell mdl-cell--4-col mdl-cell--12-col-tablet mdl-shadow--2dp\">"+
      "        <figure class=\"mdl-card__media\">"+
      "          <input type=\"text\" class=\"picker\" id=\"MASTER\" data-wcp-layout=\"block\" />"+
      "        </figure>"+
      "        <div class=\"mdl-card__title\">"+
      "          <h1 class=\"mdl-card__title-text\">Master Switch</h1>"+
      "        </div>"+
      "        <div class=\"mdl-card__actions mdl-card--border\">"+
      "          <div class=\"mdl-layout-spacer\"></div>"+
      "          <label class=\"mdl-switch mdl-js-switch mdl-js-ripple-effect\" for=\"switchMASTER\">"+
      "            <input type=\"checkbox\" class=\"mdl-switch__input onoffswitch-checkbox\" db_id=\"MASTER\" id=\"switchMASTER\">"+
      "            <span class=\"mdl-switch__label\"></span>"+
      "          </label>"+
      "          <div class=\"mdl-textfield mdl-js-textfield\" style=\"width:70px\">"+
      "            <input class=\"mdl-textfield__input\" type=\"text\" id=\"rgbMASTER\" maxlength=\"6\" >"+
      "          </div>"+
      "        </div>"+
      "      </div>"  +
      "<script>$( \"#switchMASTER\" ).click(onOnOff);</script>");



        $(".picker").wheelColorPicker('setColor', initial_color);
        $("#rgbMASTER").val(rgb);
        $("#rgbMASTER").change(function(){setRgbColor("MASTER", $("#rgbMASTER").val()) });;
        $(".picker").on('sliderup', function() {
            hsv_str = $(this).wheelColorPicker('getValue', 'hsb');
            hsv = $(this).wheelColorPicker('getColor');
            print(hsv);
            onColorChanged({h:Math.round(hsv.h*360), s: hsv.s, b:hsv.v}, "MASTER" );
	      });
  

  }


  $(".lights-area").append(

      "<div class=\"mdl-card mdl-card-light-color mdl-cell mdl-cell--4-col mdl-cell--12-col-tablet mdl-shadow--2dp\">"+
      "  <figure class=\"mdl-card__media\">"+
      "   <input type=\"text\" class=\"picker\" id=\"" + service.db_id + "\" data-wcp-layout=\"block\" />" +
      "  </figure>"+
      "        <div class=\"mdl-card__title\">"+
      "          <h1 class=\"mdl-card__title-text\">"+service.name+" ("+device_type+")"+"</h1>"+
      "        </div>"+
      "        <div class=\"mdl-card__actions mdl-card--border\">"+
      "          <div class=\"mdl-layout-spacer\"></div>"+
      "          <label class=\"mdl-switch mdl-js-switch mdl-js-ripple-effect\" for=\"switch" + service.db_id + "\">"+
      "           <input type=\"checkbox\" db_id=\""+ service.db_id+"\" class=\"mdl-switch__input onoffswitch-checkbox\" id=\"switch" + service.db_id + "\" " + checked + ">" +
      "           <span class=\"mdl-switch__label\"></span>"+
      "          </label>"+
      "          <div class=\"mdl-textfield mdl-js-textfield\" style=\"width:70px\">"+
      "            <input class=\"mdl-textfield__input\" type=\"text\" id=\"rgb" + service.db_id + "\" maxlength=\"6\" >"+
      "          </div>"+
      "        </div>"+
      "      </div>"  +
      "<script>$( \"#switch"+ service.db_id +"\" ).click(onOnOff);</script>");



  print("setcolor: "+ JSON.stringify(initial_color));
  $(".picker").wheelColorPicker('setColor', initial_color);
  $("#rgb"+service.db_id).val(rgb);
  $("#rgb"+service.db_id).change(function(){setRgbColor(service.db_id, $("#rgb"+service.db_id).val()) });;
  $(".picker").on('sliderup', function() {
      hsv_str = $(this).wheelColorPicker('getValue', 'hsb');
      hsv = $(this).wheelColorPicker('getColor');
      print(hsv);
      onColorChanged({h:Math.round(hsv.h*360), s: hsv.s, b:hsv.v}, $(this).attr("id"));
	});



  print("power: " + service.properties.power.on);
  print("hsb: " + initial_color  );
  componentHandler.upgradeDom();

}



function appendGenericSensor(service, device_type){
/*  html = "<div class=\"demo-card-square mdl-card mdl-shadow--2dp\">"+ 
           "<div class=\"mdl-card__title-light mdl-card--expand-half\">"+
              "<h2 class=\"mdl-card__title-text\">"+service.name+" ("+device_type+")"+"</h2>"+
           "</div>";

  $.each(service.properties, function(property, value){
    if(property == "motion")
      html += "<div><h2>" + property +": " + value.on + "</h2></div>"
  });

  html += "</div>";
  $(".lights-area").prepend(html);
  componentHandler.upgradeDom();
*/
  motionSensorService = service;
  toastMotion(service);
  //DEMO:
  //keep querying this service:
  if(demomode)
    pollService(motionSensorService);
}



function appendMobileDevice(mobile){
  if( !demomode ) {
    $("#whos-home").append(
      "<div class=\"demo-card-square mdl-card mdl-cell mdl-cell--12-col mdl-cell--12-col-tablet mdl-shadow--2dp\">"+
        "<div class=\"mdl-card__title mdl-card--expand\">"+
          "<h2 class=\"mdl-card__title-text\">"+Math.ceil(((new Date()).getTime()-(new Date(mobile.last_seen)).getTime())/(1000*60))+" minutes ago</h2>"+
        "</div>"+
        "<div class=\"mdl-card__supporting-text\">"+
          mobile.manufacturer + " " + mobile.name + 
        "</div>"+
      "</div>");
  }
  else {
    $("#whos-home").append(
      "<div class=\"demo-card-square mdl-card mdl-cell mdl-cell--12-col mdl-cell--12-col-tablet mdl-shadow--2dp\">"+
        "<div class=\"mdl-card__title mdl-card--expand\">"+
          "<h2 class=\"mdl-card__title-text\">"+mobile+"</h2>"+
        "</div>"+
        "<div class=\"mdl-card__supporting-text\">"+  mobile + " is home" + 
        "</div>"+
      "</div>");


  }
}


function setRgbColor(db_id, rgb) {
  //change the rgb to hsb:
  hsb = rgb2Hsb(strToColor(rgb));
  $("#"+db_id).wheelColorPicker('setColor', {h:(hsb.h/360), s:hsb.s, v:hsb.b, a:1});
  onColorChanged(hsb, db_id);
}

function onColorChanged(color, db_id) { 
  rgb = colorToStr( hsb2Rgb(color) );
  if(db_id == "MASTER" ){
    $(".picker").each( function(){
      new_color = {h:(color.h/360), s:color.s, v:color.b, a:1};
      $(this).wheelColorPicker('setColor', new_color);
    });
    $("#rgbMASTER").val(rgb);

    //now set the color:
    $.each(mIotServices, function(db_id, v) {
      //set the picker color:
      if(isLightService(v.service))
        onColorChanged(color, db_id);
    });
    return;
  }


  print(db_id + "COLOR: " + JSON.stringify(color));
  service = mIotServices[db_id].service;
  if(!isLightService(service) )
    return;
  service.properties.color.hue = color.h;
  service.properties.color.sat = color.s;
  service.properties.color.bri = color.b;

  print(service.properties.color.hue+ ":" + 
              service.properties.color.sat+ ":"+ 
              service.properties.color.bri);
  service.properties.power.on = true;



  //now set the color:
  $("#rgb"+  db_id  ).val(rgb);
  var light_switch = $("#switch"+  db_id  );
  if( !light_switch.is(':checked') ){
    light_switch.trigger('click');
  } else {
    WeaverSetServices(buildServiceJson(service));
  }
}



function onOnOff(){
  //first check or uncheck:
  var $this = $(this);
  db_id = $this.attr("db_id");
  checked = $this.is(':checked');

  if(db_id == "MASTER"){
    if(checked){
      allOn();
    }else{
      allOff();
    }

  } else {
    service = mIotServices[db_id].service;
    //now set the power:
    service.properties.power.on = checked;
    WeaverSetServices(buildServiceJson(service));
  }
}


function toggleLabDemoMode(){

  enable = false
  if ($('#demo-toggle').is(":checked")){
    enable = true;
    $("#demo-toggle-text").text("Disable Test-Lab Demo Mode");
  } else {
    $("#demo-toggle-text").text("Enable Weaver Developer Test-Lab Demo Mode");
  }

  WeaverLabDemoMode(enable)


}


function allOn(){
  $(".onoffswitch-checkbox").each(function () {
     if(!$(this).is(':checked')){
        $(this).click(); 
     }
  });
  window.location.href = '#close';
}

function allOff(){
  $(".onoffswitch-checkbox").each(function () {
     if($(this).is(':checked')){
        $(this).click(); 
     }
  });


  window.location.href = '#close';
}


//************************************************
// Event handlers and interoperability functions:
//************************************************
function toastMotion(service){
  $.each(service.properties, function(property, value){
    if(property == "motion"){
      if(motionState == null || value.on != motionState){
        $("#motion").attr("data-badge", value.on?"on":"off");
        motionState = value.on;
        showToast(property +": " + value.on);
        if(motionState)
          intruderAlert();
      }
    }
  });
}

function onPolledServicesUpdated(data){
  services = data.services;

  print("onPolledServicesUpdated: \n" + JSON.stringify(data));
  for (var i = 0; i < services.length; i++) {
    service = services[i];
    if(isSensorService(service)){
      motionSensorService = service;
      toastMotion(service);
    }
  }
  setTimeout(function(){
      pollService(motionSensorService);
  }, 1000);
}

function pollService(service){
  console.log("pollService: " + JSON.stringify(service));
  WeaverUpdateServices(buildServiceJson(service), onPolledServicesUpdated);
}




function handleNooneHome(){
  //first check if there are any services and if they are on:
  if(handledNooneHome)
    return;
  handledNooneHome = true;
  handledSomeoneHome = false;

  $(".onoffswitch-checkbox").each(function () {
     if($(this).is(':checked')){
        $("#modal-title").html("<h3>No-one home, would you like to turn off the lights?</h3>");
        $("#modal-text").html("<button id=\"turn-lights-off-button\"><span>YES</span></button>" + 
          "<script>$( \"#turn-lights-off-button\" ).click(allOff);</script>"
        );
        window.location.href = '#openModal';
      }
  });
}

function handleSomeoneGotHome(mobile){
  //first check if there are any services and if they are on:
  if(handledSomeoneHome)
    return;

  handledSomeoneHome = true;
  handledNooneHome = false;

  
  if(mobile == null )
    mobile = "";
  


  $(".onoffswitch-checkbox").each(function () {
     if(!$(this).is(':checked')){
        $("#modal-title").html("<h3>Welcome home, " + mobile.trim() + "! Would you like to turn on the lights?</h3>");
        $("#modal-text").html("<button id=\"turn-lights-off-button\"><span>YES</span></button>" + 
          "<script>$( \"#turn-lights-off-button\" ).click(allOn);</script>"
        );
        window.location.href = '#openModal';
      }
  });
}

function triggerAlarm(on){
  if(on){
    ALARM_STATUS = true;
    alarm(0);
  }
  else 
    ALARM_STATUS = false;
}


function alarm(colorArrayIdx){
  if(!ALARM_STATUS){
    onColorChanged(COLORS[0], "MASTER");
    return;
  }
  onColorChanged(COLORS[colorArrayIdx], "MASTER");
  colorArrayIdx+=1;
  colorArrayIdx %= COLORS.length;
  setTimeout(function() {
    alarm(colorArrayIdx)
  }, 2000);
}

//DEMOMODE:

function intruderAlert(){

 triggerAlarm(true);
 setTimeout(function() {
   triggerAlarm(false);
 }, 20000);

}

function verifyNewcommer(k){
  if(k.toLowerCase().indexOf("yuval") < 0 ) 
    showToast("Welcome Home " + k );
  else {
    showToast("Intruder Alert " + k );
    intruderAlert();
  }
}



//******************************************
// Notifications:
//******************************************
function showInfo(title, info){

  $("#modal-title").html("<h3>"+title+"</h3>");
  $("#modal-text").html("<p>" + info +"</p>");
  window.location.href = '#openModal';

}


function showToast(message) {
  'use strict';
  var snackbarContainer = document.querySelector('#toast');
  var data = {message:message, timeout: 3000};
  snackbarContainer.MaterialSnackbar.showSnackbar(data);
}


//notifications area:
$('#notif').click(function(){
 if($('.mdl-layout__drawer-right').hasClass('active')){       
    $('.mdl-layout__drawer-right').removeClass('active'); 
 }
 else{
    $('.mdl-layout__drawer-right').addClass('active'); 
 }
});

$('.mdl-layout__obfuscator-right').click(function(){
 if($('.mdl-layout__drawer-right').hasClass('active')){       
    $('.mdl-layout__drawer-right').removeClass('active'); 
 }
 else{
    $('.mdl-layout__drawer-right').addClass('active'); 
 }
});





//**********************************************************
// The main functions - loggs in to Weaver Cloud and starts 
// the scan cycle:
//**********************************************************
$( document ).ready(function() {
  AUTH_TOKEN = Cookies.get("auth");
  if(AUTH_TOKEN == "undefined" || AUTH_TOKEN == null || AUTH_TOKEN == "" )
    AUTH_TOKEN = readFromLocalStorage("auth");

  if(AUTH_TOKEN !== "undefined" && AUTH_TOKEN != null && AUTH_TOKEN != "" ){
    print(AUTH_TOKEN);
    $("#login-register-box").hide();
    WeaverInit();
  }else{
    $("#login-register-box").show();
  }
});

