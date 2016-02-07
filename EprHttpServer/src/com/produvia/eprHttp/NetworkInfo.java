package com.produvia.eprHttp;

import java.net.InetAddress;
import java.util.Enumeration;
import java.util.StringTokenizer;
import java.net.NetworkInterface;
import java.net.InterfaceAddress;
import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;


import java.net.URI;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLDecoder;
import java.net.UnknownHostException;
import java.net.MalformedURLException;

class NetworkInfo {

    public static String mOs;

	  public static String mSsid = "";
	  public static String mDns = "";
	  public static String mDefaultGateway = "";
	  public static String mDeviceName = "";
	  public static String mDeviceMac = "";
	  public static String mDeviceIp = "";
	  public static String mGlobalIp = "";


	  private static void debugPrint(String s){
		  mainHttp.debugPrint(s);	
	  }
    public static void main(String [] args){
      init();
      printInfo();

    }

    public static void init(){
      mOs =  System.getProperty("os.name").toLowerCase();
      IpChecker.setGlobalIp();
      mDeviceIp = getActiveAddresses("ip");
      mDeviceMac = getActiveAddresses("mac");
      mDeviceName = getActiveAddresses("hostname");

      mSsid = getSsid();
      mDefaultGateway = getDefaultGateway();
      mDns = mDefaultGateway;

    }
    public static void printInfo(){
      System.out.println( "OS:              " +  mOs);
      System.out.println( "IP:              " +  mDeviceIp);
      System.out.println( "MAC:             " +  mDeviceMac);
      System.out.println( "HOSTNAME:        " +  mDeviceName);
      System.out.println( "SSID:            " +  mSsid);
      System.out.println( "DEFAULT_GATEWAY: " +  mDefaultGateway);
      System.out.println( "DNS:             " +  mDns);
      System.out.println( "GLOBAL IP:       " +  mGlobalIp);

    }


    private static String getActiveAddresses(String info) {

        try {

            if(info.equals("hostname")){
               return java.net.InetAddress.getLocalHost().getHostName();
            }
 

            Enumeration<NetworkInterface> networks = NetworkInterface.getNetworkInterfaces();
            while( networks.hasMoreElements()){
                NetworkInterface network = networks.nextElement();
                for ( InterfaceAddress netwrok_interface : network.getInterfaceAddresses())
                    if ( netwrok_interface.getAddress().isSiteLocalAddress()){
                        if(info.equals("mac")){
                          byte[] mac = network.getHardwareAddress();
                          if(mac != null) {
                            StringBuilder sb = new StringBuilder();
                            for (int i = 0; i < mac.length; i++) {
                              sb.append(String.format("%02x%s", mac[i], (i < mac.length - 1) ? ":" : ""));
                            }
                            return sb.toString();
                          }
                        }else if(info.equals("ip")){
                          return ( netwrok_interface.getAddress().getHostAddress() );
                        }
                    }
            }

        } catch (Exception e) {
        	debugPrint("EXCEPTION IN getActiveAddress: " + e.getMessage());
            e.printStackTrace();
        }
        return null;


    }



  	private static String getSsid(){     
      if(mOs.indexOf("windows") >= 0 )
        return runCommmand("netsh show wlan interfaces | findstr /r \"^....SSID\"");
      else
     		return doLinuxCommand("nm-tool |grep --only-matching '*[^ ][^:]*' |sed 's/^*//'");
  	}

  	private static String getDefaultGateway(){
      if(mOs.indexOf("windows") >= 0 ){
        String thisLine = runCommmand("traceroute -m 1 www.amazon.com");
        StringTokenizer st = new StringTokenizer(thisLine);
        st.nextToken();
        return st.nextToken();
      }
      else
  	  	return doLinuxCommand("/sbin/ip route | awk '/default/ { print $3 }'");
	  }


	private static String doLinuxCommand(String cmd_str){
		
		String[] cmd = {
				"/bin/sh",
				"-c",
				cmd_str
				};

    return runCommmand(cmd);
	}


  private static String runCommmand(Object cmd_in){
		String [] cmd;
    if(cmd_in instanceof String){
      cmd = new String[1];
      cmd[0] = (String)cmd_in;
    } else{
      cmd = (String[])cmd_in;
    }

		Process p;
		StringBuilder sb = new StringBuilder();
		try {
  			p = Runtime.getRuntime().exec(cmd);
			
		    p.waitFor();
	
		    BufferedReader reader = 
		         new BufferedReader(new InputStreamReader(p.getInputStream()));
	
		    String line = "";

		    while ((line = reader.readLine())!= null) {
		    	sb.append(line);
		    }
		    
		} catch (IOException e) {
			debugPrint("EXCEPTION IN runCommand - " + cmd.toString() + ": " + e.getMessage());
			e.printStackTrace();
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			debugPrint("EXCEPTION IN runCommand - " + cmd.toString() + ": " + e.getMessage());
			e.printStackTrace();
		}
		return sb.toString();

  }
    private static class IpChecker {

        public static void setGlobalIp(){
        	mGlobalIp = getIp();
        }

        private static final String[] hosts = {
                "http://checkip.amazonaws.com",
                "http://icanhazip.com/",
                "http://curlmyip.com/",
                "http://www.trackip.net/ip",
                "http://produvia.mooo.com:8000/client_ip.php"
        };
        private static String getIp(){
            return getIp(0);
        }



        private static String getIp(int idx) {
            if(idx >= hosts.length)
                return null;
            try {
                URL url = new URL(hosts[idx]);
                URLConnection con = url.openConnection();
                con.setConnectTimeout(2000);
                con.setReadTimeout(2000);
                BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream()));
                String ip = in.readLine();
                return ip;
            } catch (MalformedURLException e) {
            	debugPrint("EXCEPTION IN getIp: " +e.getMessage());
                return getIp(idx+1);
            } catch (IOException e) {
            	debugPrint("EXCEPTION IN getIp: " +e.getMessage());
                return getIp(idx+1);
            }

        }
    }

    public static Integer ipToInteger(String ip) {
        if (ip == null)
            return null;

        int[] ip_array = new int[4];
        String[] parts = ip.split("\\.");
        for (int i = 0; i < 4; i++) {
            ip_array[3-i] = Integer.parseInt(parts[i]);
        }
        Integer ipNumbers = 0;
        for (int i = 0; i < 4; i++) {
            ipNumbers += ip_array[i] << (24 - (8 * i));
        }
        return ipNumbers;
    }


}
