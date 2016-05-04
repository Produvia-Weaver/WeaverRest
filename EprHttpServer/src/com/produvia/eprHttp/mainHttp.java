package com.produvia.eprHttp;


import com.produvia.sdk.DateTimeFormatterEx;

import com.produvia.sdk.WeaverSdk;
import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpsConfigurator;
import com.sun.net.httpserver.HttpsParameters;
import com.sun.net.httpserver.HttpsServer;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.MalformedURLException;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.net.URI;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLDecoder;
import java.net.UnknownHostException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.security.KeyManagementException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.UnrecoverableKeyException;
import java.security.cert.CertificateException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Iterator;
import java.util.Timer;
import java.util.TimerTask;
import java.util.Set;



import javax.net.ssl.SSLEngine;
import javax.net.ssl.SSLParameters;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.produvia.weaverlinuxsdk.NetworkInfo;
import com.produvia.weaverlinuxsdk.WeaverSdkApi;
public class mainHttp{

  
  ///DEMO MODE:
  public static boolean mRunningPings = false;
  public static HashMap mOnlinePhones = new HashMap();
  public static HashMap mOnlinePhoneNames = new HashMap();
  public static void initWhosHome(){
    if( mRunningPings == true )
      return;
    mRunningPings = true;
    mOnlinePhones.put("192.168.13.109", false );
    mOnlinePhoneNames.put("192.168.13.109", "Lucy" );
    mOnlinePhones.put("192.168.13.152", false );
    mOnlinePhoneNames.put("192.168.13.152", "Johnny" );

    mOnlinePhones.put("192.168.13.140", false );
    mOnlinePhoneNames.put("192.168.13.140", "Alice" );

    mOnlinePhones.put("192.168.13.141", false );
    mOnlinePhoneNames.put("192.168.13.141", "Bob" );



    Timer timer = new Timer();

    timer.schedule( new TimerTask() {
        public void run() {
           updateWhosHome();
        }
     }, 0, 6*1000);

  }
  public static void updateWhosHome(){
    if(NetworkInfo.mOs == null )
      return;

    // Get a set of the entries
    Set set = mOnlinePhones.entrySet();
    // Get an iterator
    Iterator i = set.iterator();
    // Display elements
    while(i.hasNext()) {

      Map.Entry me = (Map.Entry)i.next();
      String key = (String)me.getKey();

      if(NetworkInfo.mOs.indexOf("mac") >= 0) {
        String ping_results = NetworkInfo.doLinuxCommand("ping -c 1 -W 1 " + key + " |grep packets");
        if(ping_results.split("\\s+")[0].equals("1"))
          mOnlinePhones.put(key, true );
        else
          mOnlinePhones.put(key, false );

      } else {
        String ping_results = NetworkInfo.doLinuxCommand("ping -c 1 -w 1 " + key + " |grep packets");
        if(ping_results.split("\\s+")[3].equals("1"))
          mOnlinePhones.put(key, true );
        else
          mOnlinePhones.put(key, false );
      }

       //System.out.print( mOnlinePhoneNames.get(key) + ": ");
       //System.out.println(me.getValue());

    }


  }
  public static void addWhosHome(JSONObject reply){
      /////////////////////////////////////////////////////////////
      ////demo - WHOSE HOME:
      Set set = mOnlinePhones.entrySet();
      // Get an iterator
      Iterator i = set.iterator();
      // Display elements
      JSONObject whosHome = new JSONObject();
      while(i.hasNext()) {
        Map.Entry me = (Map.Entry)i.next();
        String key = (String)me.getKey();

        whosHome.put( (String)mOnlinePhoneNames.get(key), me.getValue() );
      }
      reply.put("whos_home_demo", whosHome);
  }
	/////

	public static final boolean DEBUG_MODE = true; 
	private static final boolean USE_SSL = false;
	
	
	
	private static ArrayList<String>keysVerifiedInThisSession = new ArrayList<String>();

	private static JSONArray mScannedServices = new JSONArray();
	private static Integer mMobileCount = null;
	
	
	private static String mLatestScanInfo = "";
	private static int mScanCycleCounter = 0;
	
	
	private static final String FUNC_LOGIN      = "login";
	private static final String FUNC_REGISTER   = "register";
	
	private static final String FUNC_SERVICES   = "services";
	
    private static final long MAX_TIME_TO_BE_CONSIDERED_ONLINE = (10*60);
    private static final long MAX_TIME_TO_BE_CONSIDERED_ONLINE_LAB = (2*60);	
	
	
	
    private static String API_KEY = null;    
    private static int PORT = 8080;
    private static final int BACKLOG = 1;

    private static final String HEADER_ALLOW = "Allow";
    private static final String HEADER_CONTENT_TYPE = "Content-Type";

    private static final Charset CHARSET = StandardCharsets.UTF_8;

    private static final int STATUS_OK = 200;
    private static final int STATUS_METHOD_NOT_ALLOWED = 405;

    private static final int NO_RESPONSE_LENGTH = -1;

    private static final String METHOD_DEL = "DELETE";
    private static final String METHOD_GET = "GET";
    private static final String METHOD_POST = "POST";
    private static final String METHOD_OPTIONS = "OPTIONS";
    private static final String ALLOWED_METHODS = METHOD_GET + ", " + METHOD_POST + ", " + METHOD_DEL + ", " + METHOD_OPTIONS;


    public static void debugPrint(String message){
    	if(!DEBUG_MODE)
    		return;
    	System.out.println("[DEBUG] " + message);    	
    }

    private static void showUsage(){
    	System.out.println("USAGE: java -jar WeaverHttpServer.jar -a API_KEY [-p PORT (defaults to 8080)]");
        System.exit(-1);
    }
    private static void parseArgs(final String... args){
        if(args.length < 2)
            showUsage();

        boolean next_arg_parameter = false;
        String last_arg = null;
        for (String s: args) {
          if(s.equals("-all")){
            WeaverSdk.RETURN_NON_IOT_SERVICES = true;
          }else if( s.equals("-a") || s.equals("-p") ){
            if(next_arg_parameter)
                showUsage();
            next_arg_parameter = true;
          } else if( next_arg_parameter == false ){
              showUsage();
          } else {
            next_arg_parameter = false;
            if(last_arg.equals("-a") ) {//grab the apikey
              API_KEY = s;
            } else if(last_arg.equals("-p")){
                try {
                    PORT = Integer.parseInt(s);
                } catch (NumberFormatException e) {
                    showUsage();
                }
            }
          }
          last_arg = s;

        }
	      if( API_KEY == null ){
                 showUsage();
	      }
    }

    public static void main(final String... args) throws IOException {

        //DEMODEMO
        //initWhosHome();
        ////DEMODEMO
        parseArgs(args);
        NetworkInfo.init();


        HttpServer server = null;
        if (USE_SSL)
            server = buildHttpsServer();
        else
            server = HttpServer.create(new InetSocketAddress(PORT), BACKLOG);


        server.createContext("/add_certificate", httpHandler);
        server.createContext("/init", httpHandler);
        server.createContext("/scan", httpHandler);
        server.createContext("/services_get", httpHandler);
        server.createContext("/services_set", httpHandler);
        server.createContext("/services_update", httpHandler);
        server.createContext("/register", httpHandler);
        server.createContext("/login", httpHandler);
        server.createContext("/demomode", httpHandler);

        server.start();
        //setup the device parameters:
        System.out.println("====Weaver Server Started====\nAddress: http" + 
               (USE_SSL?"s":"") + "://"+ NetworkInfo.mDeviceIp + ":" + PORT);
        System.out.println("SYSTEM INFO");
        NetworkInfo.printInfo();
    }

    private static Map<String, List<String>> getRequestParameters(final URI requestUri) {
        final Map<String, List<String>> requestParameters = new LinkedHashMap<>();
        final String requestQuery = requestUri.getRawQuery();
        if (requestQuery != null) {
            final String[] rawRequestParameters = requestQuery.split("[&;]", -1);
            for (final String rawRequestParameter : rawRequestParameters) {
                final String[] requestParameter = rawRequestParameter.split("=", 2);
                final String requestParameterName = decodeUrlComponent(requestParameter[0]);
                if(!requestParameters.containsKey(requestParameterName))
                	requestParameters.put(requestParameterName, new ArrayList<String>());
                final String requestParameterValue = requestParameter.length > 1 ? decodeUrlComponent(requestParameter[1]) : null;
                requestParameters.get(requestParameterName).add(requestParameterValue);
            }
        }
        return requestParameters;
    }

    private static String decodeUrlComponent(final String urlComponent) {
        try {
            return URLDecoder.decode(urlComponent, CHARSET.name());
        } catch (final UnsupportedEncodingException e) {
        	debugPrint("EXCEPTION IN decodeUrlComponent: " + e.getMessage());
            return "";
        }
    }
    
    
    private static final HttpHandler httpHandler = new HttpHandler() {
		
		@Override
		public void handle(HttpExchange he) throws IOException {
			try {
				
								
				final Headers requestHeaders = he.getRequestHeaders();
                final Headers responseHeaders = he.getResponseHeaders();
                final String requestMethod = he.getRequestMethod().toUpperCase();
                final String path  = he.getRequestURI().getRawPath();
                final String query = he.getRequestURI().getQuery();
                Map<String, List<String>> requestParameters;
                he.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
                he.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

                
                switch (requestMethod) {
                	case METHOD_OPTIONS:
                		responseHeaders.clear();
                        
                        he.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
                        he.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
                        he.sendResponseHeaders(STATUS_OK, NO_RESPONSE_LENGTH);
                        he.close();
                		break;
                
                	
                    case METHOD_GET:

                    	//here are the functions:
                    	if(path.equals("/add_certificate")){ //add the cetificate
                    		sendReplyAndClose(he, new JSONObject("{ \"success\": true, \"info\": \"certificate added successfully\"}") );                    		
                    	}
                    	
                    	
                        break;

                    case METHOD_POST:
                    case METHOD_DEL:
                    	
                    	InputStreamReader isr = new InputStreamReader(he.getRequestBody(), CHARSET);
                    	BufferedReader br = new BufferedReader(isr);
                    	String body = "";
                    	String line;
                    	while((line = br.readLine())!= null)
                    		 body += line;
                    	
                    	requestParameters = getRequestParameters(he.getRequestURI());
                    	JSONObject response =new JSONObject();
                    	JSONObject request = new JSONObject();
                    	
                    	JSONObject jsonHeaders = new JSONObject(); 
                    	for (Entry<String, List<String>> entry : requestHeaders.entrySet()){
                    		JSONArray header_vals = new JSONArray(entry.getValue());
                    		jsonHeaders.put(entry.getKey(), header_vals);
                    	}
                        //we'll stick the API key over here:
                    	request.put("headers", jsonHeaders);
                    	request.put("body", new JSONObject(body));
                        request.getJSONObject("body").put("api_key", API_KEY );
                    	if(path.equals("/init"))
                    		init(he, request);
                    	else if(path.equals("/scan"))
                    		scan(he, request);
                    	else if(path.equals("/services_set"))
                    		servicesSet(he, request);
                        else if(path.equals("/services_update"))
                            servicesUpdate(he, request);
                    	else if(path.equals("/services_get"))
                    		servicesGet(he, request);
                    	else if(path.equals("/register"))
                    		register(he, request);
                    	else if (path.equals("/login"))
                    		login(he, request);
                    	else if(path.equals("/demomode"))
                    		demomode(he, request);


                    	else{
                    		sendReplyAndClose(he, new JSONObject("{ \"success\": false, \"info\": \"User not logged in\"}") );
                    	}
                    	
                        break;
                    default:
                        responseHeaders.set(HEADER_ALLOW, ALLOWED_METHODS);
                        he.sendResponseHeaders(STATUS_METHOD_NOT_ALLOWED, NO_RESPONSE_LENGTH);
                        he.close();
                        break;
                }
			}catch(Exception e){
				debugPrint("EXCEPTION IN httpHandler: " + e.getMessage());
				e.printStackTrace();
				sendReplyAndClose(he, new JSONObject("{ \"success\": false, \"info\": \"Encountered an error while processing the request\"}") );

            } finally {
            }
			
		}
	};
	
	private static void sendReplyAndClose(final HttpExchange he, JSONObject response){
		final Headers responseHeaders = he.getResponseHeaders();
        responseHeaders.set(HEADER_CONTENT_TYPE, String.format("application/json; charset=%s", CHARSET));
        
        
        
		String responseBody = response.toString();
		byte[] rawResponseBody = responseBody.getBytes(CHARSET);
		try {
			he.sendResponseHeaders(STATUS_OK, rawResponseBody.length);
			he.getResponseBody().write(rawResponseBody);
		} catch (IOException e) {
			debugPrint("EXCEPTION IN sendReplyAndClose: " + e.getMessage());
			e.printStackTrace();
		}finally {
			he.close();
		}
	}
	
	
	
	private static String getAuthFromHeader(JSONObject headers){
		
		String auth_token = null;
		if(headers.has("Authorization")){
			auth_token = headers.getJSONArray("Authorization").getString(0);
			auth_token = auth_token.replace("Bearer ", "");
		}
		
		
		return auth_token;
	}
	
    /**
	 * name: init
	 * description:  initializes the sdk
	 */
	private static void init(final HttpExchange he, JSONObject request) {
		
		/*
		 * HEADER= Authorization: Bearer authentication_token"
		 * json = {"api_key": API_KEY }
		 * 
		 * 
		 */		
		final String api_key = request.getJSONObject("body").getString("api_key");
		final String authentication_token = getAuthFromHeader(request.getJSONObject("headers"));
		
        WeaverSdkApi.init(api_key, authentication_token, 1);
  

        //setup network:
        if(authentication_token.isEmpty()){
            sendReplyAndClose(he, new JSONObject("{ \"success\": true, \"info\": \"Log user in, in order to complete initialization\"}"));
            return;
        }
        else {//verify the auth token is valid:
            WeaverSdkApi.login(null, null, new WeaverSdk.WeaverSdkCallback() {
				
				@Override
				public void onTaskUpdate(int arg0, JSONObject arg1) {
					// TODO Auto-generated method stub
					
				}
				
				@Override
				public void onTaskCompleted(int flag, JSONObject json) {
					try {
						debugPrint("INIT COMPLETED: action" + flag + " returned: " + json.toString());
		                if (!json.has("success"))
		                    json.put("success", false);
		                if(!json.has("info")){
		                    if(json.has("errors")){
		                        json.put("info", json.getJSONArray("errors").getString(0));
		                        json.remove("errors");
		                    }else{
		                        json.put("info", "error");
		                    }
		                }
		                if (json.getBoolean("success")) {
		                	
		                	keysVerifiedInThisSession.add(authentication_token);
		                }
		                else{
		                    if(json.has("responseCode") && json.getInt("responseCode") == 401){
		                    	
		                    }
		                }
		            } catch (Exception e) {
		            	debugPrint("EXCEPTION IN init: " + e.getMessage());
		            }
					sendReplyAndClose(he, json);
					
				}
			});
        }
    }
	
	
	

	private static void handleReceivedServices(JSONObject data) throws JSONException {
		
        JSONArray services = data.getJSONArray("services");
        for (int i = 0; i < services.length(); i++) {
            JSONObject service = services.getJSONObject(i);
            String service_type = service.getString("service");

            //if the services haven't been seen in a while - we won't display them anymore:
            /*
            Integer seconds_since_last_seen = 0;
            if(service.has("seconds_since_last_seen"))
               seconds_since_last_seen = service.getInt("seconds_since_last_seen");
            if(seconds_since_last_seen > MAX_TIME_TO_BE_CONSIDERED_ONLINE)
                continue;
            */




            if (service_type.equals("login")) {
                boolean found = false;
                for(int service_idx = 0; service_idx < mScannedServices.length(); service_idx++ ) {
                	JSONObject scannedService = mScannedServices.getJSONObject(service_idx).getJSONArray("services").getJSONObject(0);
                    if(scannedService.getString("service").equals("login")) {
                        if(servicesEqual(service, scannedService)){
                        	found = true;
                        	break;
                        }
                    }
                }
                if(!found){
	                //prompt login
	            	JSONObject dataForSingleService = new JSONObject(data.toString());
	            	mScannedServices.put(dataForSingleService);
                }
            }
            else if(service_type.startsWith("_light" )){//_light_color|| _light_dimmer || _light
                //yey! got a light_color service - let's add it to the list:
            	JSONObject device = data.getJSONObject("devices_info").getJSONObject(service.getString("device_id"));
            	JSONObject network = data.getJSONObject("networks_info").getJSONObject(service.getString("network_id"));
            	
            	boolean is_user_inside_network = network.getBoolean("user_inside_network");
                boolean is_global = isGlobal(service);
                if( !is_user_inside_network && !is_global )
                    continue;
            	
                boolean found = false;
                for(int service_idx = 0; service_idx < mScannedServices.length(); service_idx++ ) {
                	JSONObject scannedService = mScannedServices.getJSONObject(service_idx).getJSONArray("services").getJSONObject(0);
                    if(scannedService.getString("service").startsWith("_light")) {
                        if(servicesEqual(service, scannedService)){
                        	found = true;
                        	break;
                        }
                    }
                }
                if(!found){
                	JSONObject dataForSingleService = new JSONObject(data.toString());
                	mScannedServices.put(dataForSingleService);
                }
                
                
            }


        }


    }
	
	private static void scan(final HttpExchange he, JSONObject request){
		/*
		 * 
		 * HEADER= Authorization: Bearer authentication_token"
		 * json = {"api_key": API_KEY, "operation": "start"/"stop"/"state"/"info" } 
		 */
		final String authentication_token = getAuthFromHeader(request.getJSONObject("headers"));
		final String api_key = request.getJSONObject("body").getString("api_key");
		
		JSONObject reply = new JSONObject("{\"success\": true}");

		final String operation = request.getJSONObject("body").getString("operation");
		if(operation.equals("start")){
			WeaverSdkApi.startScan(new WeaverSdk.WeaverSdkCallback() {
				@Override
				public void onTaskUpdate(int flag, JSONObject response) {
					// this means a new service has been found:
			        try {
			        	debugPrint("SCAN UPDATE: action" + flag + " returned: " + response.toString());

			            //this flag indicates that a new service was discovered in the scan:
			            if (flag == WeaverSdk.ACTION_SERVICES_SCAN ) {
			                if (response.getBoolean("success")) {
			                	debugPrint("SERVICE: " + response.toString());
			                    handleReceivedServices(response.getJSONObject("data"));
			                }
			            }
			            //when the scan is running - it'll provide general state information from time to time:
			            else if (flag == WeaverSdk.ACTION_SCAN_STATUS) {
			                if (response.getBoolean("success")) {
			                	mLatestScanInfo = response.getString("info"); 
			                    if(!mLatestScanInfo.equals("Scan running")){
			                    	mScanCycleCounter += 1;
			                    }
			                }
			            }
			        }catch (JSONException e) {
			        	debugPrint("EXCEPTION IN scan: " + e.getMessage());
			            e.printStackTrace();
			        }
		
				}
				
				@Override
				public void onTaskCompleted(int arg0, JSONObject arg1) {
					// TODO Auto-generated method stub
					
				}
			});
			reply.put("info", "Scan started - start polling with \"info\" for newly scanned services and services requiring login");
		}else if(operation.equals("stop")){
			WeaverSdkApi.stopScan();
			reply.put("info", mLatestScanInfo);
		
		}else {//info
			
			reply.put("info", WeaverSdkApi.isDiscoveryRunning()?"Scan running":"Scan idle. " + "Discovered Services count is " + mScannedServices.length());
			reply.put("count", mScannedServices.length());
			if(mMobileCount != null)
				reply.put("mobileCount", mMobileCount);

      //DEMO:
      //addWhosHome(reply);

		}
		sendReplyAndClose(he, reply);
		
	}
	
	
	
	
	private static void servicesSet(final HttpExchange he, final JSONObject request){
		/*
		 * 
		 * HEADER= Authorization: Bearer authentication_token"
		 * json = {"api_key": API_KEY } 
		 */
		
		final String authentication_token = getAuthFromHeader(request.getJSONObject("headers"));
		final String api_key = request.getJSONObject("body").getString("api_key");
		WeaverSdkApi.setServices(new WeaverSdk.WeaverSdkCallback() {
			
			@Override
			public void onTaskUpdate(int flag, JSONObject json) {
				
			}
			
			@Override
			public void onTaskCompleted(int flag, JSONObject json) {
				//if it was a login service and the result is successfull - remove it from the services list:
				debugPrint("SERVICE_SET COMPLETED: action" + flag + " returned: " + json.toString());
				
				if(json.getBoolean("success")) {
					JSONArray services = request.getJSONObject("body").getJSONArray("services");
			        for (int i = 0; i < services.length(); i++) {
			        	JSONObject service = services.getJSONObject(i);
			        	if(service.getString("service").equals("login")){
			        		for(int service_idx = 0; service_idx < mScannedServices.length(); service_idx++ ) {
			                	JSONObject scannedService = mScannedServices.getJSONObject(service_idx).getJSONArray("services").getJSONObject(0);
			                    if(scannedService.getString("service").equals("login")) {
			                        if(service.getString("id").equals(service.getString("id"))){
			                        	mScannedServices.remove(service_idx);
			                        	break;
			                        }
			                    }
			                }
			        	}
			        }
				}
				
				sendReplyAndClose(he, json);
				
			}
		}, request.getJSONObject("body"));
		
	}
	
	private static void demomode(final HttpExchange he, JSONObject request){
		  /*
		   * 
		   * HEADER= Authorization: Bearer authentication_token"
		   * network_id is optional if not present will get services for all networks
		   * json = {"api_key": API_KEY, "network_id": network_id } 
		   */
  		final String authentication_token = getAuthFromHeader(request.getJSONObject("headers"));
  		final String api_key = request.getJSONObject("body").getString("api_key");
      final boolean enable = request.getJSONObject("body").getBoolean("enable");
			
      WeaverSdkApi.setDemoMode(enable, new WeaverSdk.WeaverSdkCallback() {
			
			@Override
			public void onTaskUpdate(int arg0, JSONObject arg1) {
			}
			
			@Override
			public void onTaskCompleted(int flag, JSONObject json) {
				debugPrint("demomode toggle completed: action" + flag + " returned: " + json.toString());
				sendReplyAndClose(he, json);
			}
			
		});
	}




    private static void servicesUpdate(final HttpExchange he, JSONObject request){
		/*
		 *
		 * HEADER= Authorization: Bearer authentication_token"
		 * network_id is optional if not present will get services for all networks
		 * json = {"api_key": API_KEY, "network_id": network_id }
		 */
        final String authentication_token = getAuthFromHeader(request.getJSONObject("headers"));
        final String api_key = request.getJSONObject("body").getString("api_key");

        WeaverSdkApi.updateServices(new WeaverSdk.WeaverSdkCallback() {

            @Override
            public void onTaskUpdate(int arg0, JSONObject arg1) {
            }

            @Override
            public void onTaskCompleted(int flag, JSONObject json) {
                //if it was a login service and the result is successfull - remove it from the services list:
                debugPrint("SERVICE_UPDATE COMPLETED: action" + flag + " returned: " + json.toString());
                sendReplyAndClose(he, json);
            }

        },
        request.getJSONObject("body"));
    }

	private static void servicesGet(final HttpExchange he, JSONObject request){
		/*
		 * 
		 * HEADER= Authorization: Bearer authentication_token"
		 * network_id is optional if not present will get services for all networks
		 * json = {"api_key": API_KEY, "network_id": network_id } 
		 */
		final String authentication_token = getAuthFromHeader(request.getJSONObject("headers"));
		final String api_key = request.getJSONObject("body").getString("api_key");
		String network_id = null;
		if(request.getJSONObject("body").has("network_id")){
			network_id = request.getJSONObject("body").getString("network_id");
		}
			
        WeaverSdkApi.servicesGet(network_id, new WeaverSdk.WeaverSdkCallback() {
			
			@Override
			public void onTaskUpdate(int arg0, JSONObject arg1) {
			}
			
			@Override
			public void onTaskCompleted(int flag, JSONObject json) {
				debugPrint("SERVICES GET COMPLETED: action" + flag + " returned: " + json.toString());
					
					
			  //add all the login services:
			  if(json.getJSONObject("data").has("services")){
					for(int service_idx = 0; service_idx < mScannedServices.length(); service_idx++ ) {
	                	JSONObject scannedService = mScannedServices.getJSONObject(service_idx).getJSONArray("services").getJSONObject(0);
            if(scannedService.getString("service").equals("login"))
	                    	json.getJSONObject("data").getJSONArray("services").put(scannedService);
					}
				} else if(mScannedServices.length() >= 0){
					json.getJSONObject("data").put("services", mScannedServices);
				}
        //remove all the old services:
        json = removeStaleServices(json);
				sendReplyAndClose(he, json);
			}
			
		});
	}
	
  //*
  //* remove stale  services:
  //*
  private static JSONObject removeStaleServices(JSONObject json){
    JSONArray services = json.getJSONObject("data").getJSONArray("services");
    JSONArray new_services = new JSONArray();
    for(int i =0; i< services.length(); i++ ){
      JSONObject service = services.getJSONObject(i);
      JSONObject device = json.getJSONObject("data").getJSONObject("devices_info").getJSONObject(service.getString("device_id"));
      /*
      boolean is_lab_device = device.has("mac") && device.getString("mac").startsWith("000000000000%");
      if(service.has("seconds_since_last_seen") ){
        Integer ssls = service.getInt("seconds_since_last_seen");
        if( (is_lab_device && ssls > MAX_TIME_TO_BE_CONSIDERED_ONLINE_LAB) ||
            (ssls > MAX_TIME_TO_BE_CONSIDERED_ONLINE) ){
          continue;
        }
      }*/
      new_services.put(service);
    }
    json.getJSONObject("data").put("services", new_services);
    return json;
  }
	
	private static void register(final HttpExchange he, JSONObject request){
		/*
		 * 
		 * HEADER= Authorization: Bearer authentication_token"
		 * json = {"api_key": API_KEY, "email": email, "username":username, "password": password } 
		 */
		final String api_key = request.getJSONObject("body").getString("api_key");
		WeaverSdkApi.init(api_key, null, 1);
		final String email = request.getJSONObject("body").getString("email");
		final String username = request.getJSONObject("body").getString("username");
		final String password = request.getJSONObject("body").getString("password");
		WeaverSdkApi.register(email, username, password, password, new WeaverSdk.WeaverSdkCallback() {
			
			@Override
			public void onTaskUpdate(int arg0, JSONObject arg1) {}
			
			@Override
			public void onTaskCompleted(int flag, JSONObject json) {
                try {
                	debugPrint("REGISTER COMPLETED: action" + flag + " returned: " + json.toString());
                    if (json.getBoolean("success")) {
                        JSONObject data = json.getJSONObject("data");
	                	keysVerifiedInThisSession.add(data.getString("auth_token"));
                    }else{
                    }
                } catch (Exception e) {
                	debugPrint("EXCEPTION IN register: " + e.getMessage());
                }
                sendReplyAndClose(he, json);
				
			}
		});
	}
	
	private static void login(final HttpExchange he, JSONObject request){
		/*
		 * 
		 * HEADER= Authorization: Bearer authentication_token"
		 * json = {"api_key": API_KEY, "email": email, "password": password } 
		 */
		
		final String api_key = request.getJSONObject("body").getString("api_key");
		WeaverSdkApi.init(api_key, null, 1);
		final String email = request.getJSONObject("body").getString("email");
		final String password = request.getJSONObject("body").getString("password");
		
		debugPrint("Logging in with: email: " + email + " pass: " + password + " api_key: " + api_key);
		
		WeaverSdkApi.login(email, password,new WeaverSdk.WeaverSdkCallback() {
			@Override
			public void onTaskUpdate(int arg0, JSONObject arg1) {}
			
			@Override
			public void onTaskCompleted(int flag, JSONObject json) {
				
                try {
                	debugPrint("LOGIN COMPLETED: action" + flag + " returned: " + json.toString());
                    if (json.getBoolean("success")) {
                        JSONObject data = json.getJSONObject("data");
	                	keysVerifiedInThisSession.add(data.getString("auth_token"));
                    }else{
                    }
                } catch (Exception e) {
                    debugPrint("EXCEPTION IN LOGIN: " + e.getMessage());
                }
                sendReplyAndClose(he, json);
			}
		});
	}
	
	
	
	


    public static Boolean isGlobal(JSONObject service) {
        try {
            return service.getString("service").endsWith(".global");
        }catch (JSONException e ){
        	debugPrint("EXCEPTION IN isGlobal: " + e.getMessage());
        	return false;
        }

    }

    private static String getServiceType(JSONObject service, boolean short_type){
        try {
            if(!short_type)
                return service.getString("service");
            else
                return service.getString("service").split("\\.")[0];
        }catch (JSONException e){
        	debugPrint("EXCEPTION IN getServiceType: " + e.getMessage());
            return "";
        }

    }

    private static String getId(JSONObject service) {
        try {
            return service.getString("id");
        }catch (JSONException e){
        	debugPrint("EXCEPTION IN getId: " + e.getMessage());
            return "";
        }
    }

    private static String getDeviceId(JSONObject service) {
        try {
            return service.getString("device_id");
        }catch (JSONException e){
        	debugPrint("EXCEPTION IN getDeviceId: " + e.getMessage());
            return "";
        }
    }

    
    public static boolean servicesEqual(JSONObject s1, JSONObject s2){
    	
            return ((isGlobal(s1) == isGlobal(s2)))&&
                    (getServiceType(s1, true).equals(getServiceType(s2 ,true))) &&
                    (getId(s1).equals(getId(s2)) &&
                    (getDeviceId(s1).equals(getDeviceId(s2))) );
    
    }
    
    private static HttpsServer buildHttpsServer() {
    	HttpsServer httpsServer  = null;
    	try {
	    	httpsServer  = HttpsServer.create(new InetSocketAddress(PORT), BACKLOG);
		    SSLContext sslContext = SSLContext.getInstance ( "TLS" );
	
		    // initialize the keystore
		    char[] password = "password".toCharArray ();
		    KeyStore ks = KeyStore.getInstance ( "JKS" );
		    FileInputStream fis = new FileInputStream ( "testkey.jks" );
		    ks.load ( fis, password );
	
		    // setup the key manager factory
		    KeyManagerFactory kmf = KeyManagerFactory.getInstance ( "SunX509" );
		    kmf.init ( ks, password );
	
		    // setup the trust manager factory
		    TrustManagerFactory tmf = TrustManagerFactory.getInstance ( "SunX509" );
		    tmf.init ( ks );
	
		    // setup the HTTPS context and parameters
		    sslContext.init ( kmf.getKeyManagers (), tmf.getTrustManagers (), null );
		    httpsServer.setHttpsConfigurator ( new HttpsConfigurator( sslContext )
		    {
		        public void configure ( HttpsParameters params )
		        {
		            try
		            {
		                // initialize the SSL context
		                SSLContext c = SSLContext.getDefault ();
		                SSLEngine engine = c.createSSLEngine ();
		                params.setNeedClientAuth ( false );
		                params.setCipherSuites ( engine.getEnabledCipherSuites () );
		                params.setProtocols ( engine.getEnabledProtocols () );
	
		                // get the default parameters
		                SSLParameters defaultSSLParameters = c.getDefaultSSLParameters ();
		                params.setSSLParameters ( defaultSSLParameters );
		            }
		            catch ( Exception e )
		            {
		            	debugPrint("EXCEPTION IN https configure: " + e.getMessage());
		                System.err.println( "Failed to create HTTPS port" );
		            }
		        }
		    } );
    	} catch(Exception e ){
    		debugPrint("EXCEPTION IN https configure: " + e.getMessage());
    		System.err.println( e.getMessage() );
    		System.exit(-1);
    		
    		
    	}
	    return httpsServer;
    }

}

