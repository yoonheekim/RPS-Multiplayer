var config = {
  apiKey: "AIzaSyDWGihFloZlD19tvUuaCZGel4yjMH3w7xw",
  authDomain: "rps-game-50b31.firebaseapp.com",
  databaseURL: "https://rps-game-50b31.firebaseio.com",
  projectId: "rps-game-50b31",
  storageBucket: "rps-game-50b31.appspot.com",
  messagingSenderId: "560967045393"
  };
  firebase.initializeApp(config);

  var database = firebase.database();

  
  var userName = "";
  var NUM_PLAYERS = 2;
  var PLAYERS_LOCATION = 'player_list';
  var PLAYER_DATA_LOCATION = 'player_data';
  var PLAYER_SCORE_LOCATION = 'player_score';
  var PLAYER_CHAT_LOCATION = 'chat';
  var myPlayerNumber, alreadyInGame = false;
  var opponentNumber = 0;
  var wins = 0;
  var loses = 0;
  var disconnect = false;
  
  

  $(document).ready(function(){
      $("#chat").empty();
      $(document).on("click", "#submit", get_userName);
      $(document).on("click", ".RPSbtn", setRPS);
  });



  function send_msg(){
      
      event.preventDefault();
      var msg = $("#usermsg").val();
      var playerChatRef = database.ref().child(PLAYER_CHAT_LOCATION);
      playerChatRef.push({
          content: userName+": "+msg
      });
      $("#usermsg").val("");
  }

  database.ref().child(PLAYER_CHAT_LOCATION).on("child_added", function(childSnapshot) {
      $("#chat").append(childSnapshot.val().content+"<br>");


  });

  function get_userName(){

      event.preventDefault();
      userName = $("#inputPlayer").val().trim().toLowerCase();
      if(userName===""){
          alert("Please insert your name");
      }else{
          assignPlayerNumberAndPlayGame(userName, database);
      }
      $(".player_info").empty();
      
      
  };

  function setRPS(){
      var user_RPS = $(this).attr("id");

      
      var playerDataRef = database.ref().child(PLAYER_DATA_LOCATION).child(myPlayerNumber);
      playerDataRef.set({
          userName: userName, 
          state: 'picked',
          RPS: user_RPS
      });


  }


  function assignPlayerNumberAndPlayGame(userName, database) {

      var playerListRef = database.ref().child(PLAYERS_LOCATION);
      
      playerListRef.transaction(function(playerList) {

          if (playerList === null) {
              playerList = [];
          }
          for (var i = 0; i < playerList.length; i++) {
              if (playerList[i] === userName) {
                  // Already seated so abort transaction to not unnecessarily update playerList.
                  alreadyInGame = true;
                  myPlayerNumber = i; // Tell completion callback which seat we have.
                  return;
              } else if(playerList[i]===undefined){
                  playerList[i] = userName;  // Reserve our seat.
                  myPlayerNumber = i; // Tell completion callback which seat we reserved.
              
                  return playerList;
              }
          }

          if (i < NUM_PLAYERS) {
              // Empty seat is available so grab it and attempt to commit modified playerList.
              playerList[i] = userName;  // Reserve our seat.
              myPlayerNumber = i; // Tell completion callback which seat we reserved.
              
              return playerList;
          } 

          // Abort transaction and tell completion callback we failed to join.
          myPlayerNumber = null;
      }, function (error, committed) {
          // Transaction has completed.  Check if it succeeded or we were already in
          // the game and so it was aborted.
          if (committed || alreadyInGame) {//??committed------------------
              //playerListRef.child(myPlayerNumber).OnDisconnect().remove();
              playGame(myPlayerNumber, userName, !alreadyInGame, database);
          } else {
              $("#info").empty();
              $("#info").text('Game is full.  Can\'t join. :-(');
          }
      }); 


  }

  function playGame(myPlayerNumber, userName, justJoinedGame, database) {

      if(myPlayerNumber==1){
          opponentNumber =0;
      } else if(myPlayerNumber==0){
          opponentNumber =1;
      }

      
      var playerDataRef = database.ref().child(PLAYER_DATA_LOCATION).child(myPlayerNumber);
      var playerScoreRef = database.ref().child(PLAYER_SCORE_LOCATION).child(myPlayerNumber);
      var playerListRef = database.ref().child(PLAYERS_LOCATION).child(myPlayerNumber);

      
      playerDataRef.onDisconnect().remove();
      playerScoreRef.onDisconnect().remove();
      playerListRef.onDisconnect().remove();

      $("#player_info").html("<h5>Hi "+userName+ "!   You are player number " + (parseInt(myPlayerNumber)+1)+"</h5>");
      
      

      if (justJoinedGame) {
          playerScoreRef.set({
              wins:  0,
              loses: 0
          })
          playerDataRef.set({
              userName: userName, 
              state: 'game state'
          });
          ready = true;

      }
      


  }

  function restart(){

      var playerDataRef = database.ref().child(PLAYER_DATA_LOCATION).child(myPlayerNumber);
      
      playerDataRef.set({
          userName: userName, 
          state: "game state",
          RPS: ""
      });
  }

  //when changed about player 
  database.ref().child(PLAYER_DATA_LOCATION).on("value", function(snapshot) {
    var playerChatRef = database.ref().child(PLAYER_CHAT_LOCATION);
      
      
      if (snapshot.val()==null){
          $("#player1Name").html("Wainting for Player1");
          $("#player2Name").html("Wainting for Player2");
          $("#player1_scores").empty();
          $("#player2_scores").empty();
          $("#chat").empty();
          var playerChatRef = database.ref().child(PLAYER_CHAT_LOCATION);
          playerChatRef.remove();
          disconnect = false

      } else if(snapshot.val()!==null){
          if(snapshot.val()[0]!==undefined){//when player 1 sets
              var player1_name = snapshot.val()[0].userName;
              $("#player1Name").html("Player1 : "+player1_name);
          } else if(snapshot.val()[0]==undefined) { //when player 2 sets but player1 is diconnected
              $("#player1Name").html("Wainting for Player1");
              $("#player1_scores").empty();
              if(disconnect){
                playerChatRef.push({
                  content: "Player1 has disconnected"
                });
                  
              }
          }
          if(snapshot.val()[1]!==undefined){//when player 2 sets
              var player2_name = snapshot.val()[1].userName;
              $("#player2Name").text("Player2 : "+player2_name);
          } else if(snapshot.val()[1]==undefined) {//when player 1 sets but player2 is diconnected
              $("#player2Name").html("Wainting for Player2");
              $("#player2_scores").empty();
              if(disconnect){
                playerChatRef.push({
                  content: "Player2 has disconnected"
                });
              }
          }

          if(snapshot.val()[0]!==undefined && snapshot.val()[1]!==undefined){
              if(snapshot.val()[0].state==="game state" && snapshot.val()[1].state==="game state"){
                  $("#player2").removeClass("border-warning");
                  $("#player1").addClass("border-warning");
              if(myPlayerNumber===0){
                  $("#info").html("<h5>It's your turn !</h5>");
                  $("#player1_RPS").html("<div class='col img my-auto'><img id='rock' class ='img-fluid RPSbtn' src='assets/images/rock.jpg'></div>"+
                  "<div class='col img my-auto'><img id='scissors' class='img-fluid RPSbtn'src='assets/images/scissors.jpg'></div>"+
                  "<div class='col img my-auto'><img id='paper' class='img-fluid RPSbtn' src='assets/images/paper.jpg'></div>");
                  $("#player2_RPS").empty();   
              } else if(myPlayerNumber===1){
                  $("#player2_RPS").empty();
                  $("#info").html("<h5>Waiting for "+player1_name+" to choose</h5>");
              
              }
              disconnect = true;
              

          } 
          if(snapshot.val()[0].state==="picked" && snapshot.val()[1].state==="game state"){
              $("#player1").removeClass("border-warning");
              $("#player2").addClass("border-warning");
              if(myPlayerNumber===0){
                  $("#info").html("<h5>Waiting for "+player2_name+" to choose</h5>");
                  $("#player1_RPS").html("<div class='col img my-auto'><img class='rounded' src='assets/images/"+snapshot.val()[0].RPS+".jpg'></div>");
                  $("#player2_RPS").html("<div class='col img my-auto'><img class='rounded' src='assets/images/questionmark.jpg'></div>");
              
              } else if(myPlayerNumber===1){
                  $("#info").html("<h5>It's your turn !</h5>");
                  $("#player1_RPS").empty().html("<div class='col img my-auto'><img class='rounded' src='assets/images/questionmark.jpg'></div>");
                  $("#player2_RPS").empty().html("<div class='col img my-auto'><img id='rock' class ='img-fluid RPSbtn' src='assets/images/rock.jpg'></div>"+
                  "<div class='col img my-auto'><img id='scissors' class='img-fluid RPSbtn'src='assets/images/scissors.jpg'></div>"+
                  "<div class='col img my-auto'><img id='paper' class='img-fluid RPSbtn' src='assets/images/paper.jpg'></div>");
                  
              }
          
          } 
          if(snapshot.val()[0].state==="picked" && snapshot.val()[1].state==="picked"){
              var myRPS = snapshot.val()[myPlayerNumber].RPS;
              var oppoRPS = snapshot.val()[opponentNumber].RPS;

              if(myPlayerNumber===0){
                  $("#player1_RPS").html("<div class='col img my-auto'><img class='rounded' src='assets/images/"+snapshot.val()[0].RPS+".jpg'></div>");
                  $("#player2_RPS").html("<div class='col img my-auto'><img class='rounded' src='assets/images/"+snapshot.val()[1].RPS+".jpg'></div>");
              } else if(myPlayerNumber===1){
                  $("#player1_RPS").html("<div class='col img my-auto'><img class='rounded' src='assets/images/"+snapshot.val()[0].RPS+".jpg'></div>");
                  $("#player2_RPS").html("<div class='col img my-auto'><img class='rounded' src='assets/images/"+snapshot.val()[1].RPS+".jpg'></div>");
              }
              var result = checkWins(myRPS, oppoRPS);
              if(result==="WIN"){
                  $("#game_result").html("<h1>"+snapshot.val()[myPlayerNumber].userName+"</h1><h2>WINS!</h2>");
              } else if(result==="LOSE"){
                  $("#game_result").html("<h1>"+snapshot.val()[opponentNumber].userName+"</h1><h2>WINS!</h2>");
              } else{
                  $("#game_result").html("<h1>Tie</h1><h2>Game !</h2>");
              }

              setTimeout(restart, 1000);
          
      
              }
          }

      
      }
      
      
  });
  
  //when score changed
  database.ref().child(PLAYER_SCORE_LOCATION).on("value", function(snapshot) {
      if(snapshot.val()!==null){
          if(snapshot.val()[0]!==undefined){
              var player1_wins = snapshot.val()[0].wins;
              var player1_loses = snapshot.val()[0].loses;
              $("#player1_scores").html("<p>Wins: "+player1_wins+" Loses: "+player1_loses+"</p>")
          }

          if(snapshot.val()[1]!==undefined){
              var player2_wins = snapshot.val()[1].wins;
              var player2_loses = snapshot.val()[1].loses;
              $("#player2_scores").html("<p>Wins: "+player2_wins+" Loses: "+player2_loses+"</p>")
          }
      }          
      
  });

  function checkWins(myRPS, oppoRPS){
      var playerScoreRef = database.ref().child(PLAYER_SCORE_LOCATION).child(myPlayerNumber);
      var playerDataRef = database.ref().child(PLAYER_DATA_LOCATION).child(myPlayerNumber);

      var result = "";
      //mine is rock
      if(myRPS=="rock"){
          if(oppoRPS=="scissors"){ //win
              wins += 1;
              result = "WIN";
          } else if(oppoRPS=="paper"){
              loses += 1;
              result = "LOSE";
          } else{
              result = "DRAW"
          }
      } else if(myRPS=="paper"){
          if(oppoRPS=="scissors"){ //win
              loses += 1;
              result = "LOSE";
          } else if(oppoRPS=="rock"){
              wins += 1;
              result = "WIN";
          }else{
              result = "DRAW"
          }
      } else if(myRPS=="scissors"){
          if(oppoRPS=="paper"){ //win
              wins += 1;
              result = "WIN";
          } else if(oppoRPS=="rock"){
              loses += 1;
              result = "LOSE";
          }else{
              result = "DRAW"
          }
      } 

      playerScoreRef.set({
          wins:  wins,
          loses: loses
      });

      return result;
      
  }
