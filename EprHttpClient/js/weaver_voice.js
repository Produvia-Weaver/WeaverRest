$('#voice').click(function(event){
  if(annyang.isListening()){
    $('#voice').removeClass("active");
    annyang.pause();
  }
  else{
    $('#voice').addClass("active");
    annyang.resume();
  }
});


// first we make sure annyang started succesfully
if (annyang) {
  $('#voice').addClass("active");
  // define the functions our commands will run.
  var getStarted = function() {
    window.location.href = 'http://weavingthings.com';
  }

  var lightsOn = function() {
    allOn();
  }
  var lightsOff = function() {
    allOff();
  }
  var alarmOn = function() {
    triggerAlarm(true);
  }
  var alarmOff = function() {
    triggerAlarm(false)
  }


  // define our commands.
  // * The key is the phrase you want your users to say.
  // * The value is the action to do.
  //   You can pass a function, a function name (as a string), or write your function as part of the commands object.
  var commands = {
    'let\'s get started':   getStarted,
    '*lights * on':   lightsOn,
    '*lights * on *': lightsOn,
    '*lights * off':  lightsOff,
    '*lights * off *':lightsOff,

    'להדליק אזעקה':   alarmOn,
    'לכבות אזעקה':   alarmOff,
    'להדליק את האור':   lightsOn,
    'לכבות את האור':   lightsOff

  };
  // OPTIONAL: activate debug mode for detailed logging in the console
  annyang.debug();
  // Add voice commands to respond to
  annyang.addCommands(commands);
  // OPTIONAL: Set a language for speech recognition (defaults to English)
  // For a full list of language codes, see the documentation:
  // https://github.com/TalAter/annyang/blob/master/docs/README.md#languages
  annyang.setLanguage('he');
  // Start listening. You can call this here, or attach this call to an event, button, etc.
  annyang.start();
} else {
  $(document).ready(function() {
    showInfo('No voice support', 'Upgrade browser to enable voice support');
  });
}


/*
var recognizing = false;






function onVoiceButton(event) {
  if (recognizing) {
    recognition.stop();
    $('#voice').removeClass("active");
    return;
  }
  final_transcript = '';
  recognition.start();
  ignore_onend = false;

  $('#voice').addClass("active");


  start_timestamp = event.timeStamp;
}



var start_timestamp;
if (!('webkitSpeechRecognition' in window)) {
  upgrade();
} else {

  var recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  

  recognition.onstart = function() {
    recognizing = true;
  };

  recognition.onerror = function(event) {
    if (event.error == 'no-speech') {
      $('#voice').removeClass("active");      
      ignore_onend = true;
    }
    if (event.error == 'audio-capture') {
      $('#voice').removeClass("active");
      ignore_onend = true;
    }
    if (event.error == 'not-allowed') {
      $('#voice').removeClass("active");
      ignore_onend = true;
    }
  };

  recognition.onend = function() {
    recognizing = false;
    if (ignore_onend) {
      return;
    }
    $('#voice').removeClass("active");
    if (!final_transcript) {
      return;
    }

  };

  recognition.onresult = function(event) {
    var interim_transcript = '';
    if (typeof(event.results) == 'undefined') {
      recognition.onend = null;
      recognition.stop();
      upgrade();
      return;
    }
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final_transcript += event.results[i][0].transcript;
        console.log("FINAL: " +final_transcript);

        //recognition.stop();
        //$('#voice').removeClass("active");
        //showInfo('Processing voice command', final_transcript);
        processVoiceCommand(final_transcript);
        final_transcript = "";

        
      } else {
        interim_transcript += event.results[i][0].transcript;
        console.log("INTERIM: " +interim_transcript);
      }
    }

  };
}

function upgrade() {
  $('#voice').removeClass("active");
  showInfo('Please Upgrade Browser', 'Upgrade browser to enable voice support');
}


function processVoiceCommand(command){

  if(command.indexOf(" light") < 0)
    return;
  if(command.indexOf(" status") > 0){
    return;
  }
  if(command.indexOf(" on ") > 0 || stringEndsWith(command, " on"))
    allOn();    
  if(command.indexOf(" off ") > 0 || stringEndsWith(command, " off"))
    allOff();    

}
*/
