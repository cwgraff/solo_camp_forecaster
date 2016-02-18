var app = angular.module('campApp', ['ngRoute']);


app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
    $routeProvider
        .when('/', {
            templateUrl:'views/login.html',
            controller: 'LoginController'
        })
        .when('/selection', {
            templateUrl:'views/selection.html',
            controller: 'SelectionController'
        })
        .when('/result', {
            templateUrl:'views/result.html',
            controller: 'ResultController'
        });

    $locationProvider.html5Mode(true);

}]);

app.factory('DataService', function(){

    var dateRange = {
        startDate: 0,
        endDate: 0
    };

    return dateRange;

});

app.factory('UserService', ['$http', '$location', function($http, $location){

    var userData = {};

    var makeLoginRequest = function(data){
        //$http.post('/', data).then(function(response){
        //    console.log('Response from POST - ', response);
        //    userData.server = response.data;
        //    userData.username = response.data.username;
        //    userData.isLoggedIn = true;
        //    userData.logInTime = new Date();
        //    if(response.data == 'success'){
        //        $location.path('selection');
        //    } else {
        //        return false;
        //    }
        //});
        return $http.post('/', data);
    };

    return {
        userData: userData,
        makeLoginRequest: makeLoginRequest
    };


}]);

//################################################################################
//                            Main Controller
//################################################################################

app.controller('mainController', ['$scope', '$http', 'DataService', function($scope, $http, DataService){

    //######## Global scope variable holds selected array ##########
    $scope.selectedList = [];

    //######## Global date variable holds today's date ############
    $scope.dateToday = Date.now();

}]);

//################################################################################
//                            Login Controller
//################################################################################

app.controller('LoginController', ['$http', '$scope', '$location', 'DataService', 'UserService',  function($http, $scope, $location, DataService, UserService){

    $scope.sendDataAndStuff = function() {
        //var loginSuccessful = UserService.makeLoginRequest($scope.data);

        UserService.makeLoginRequest($scope.data).then(function (response) {
            console.log('Response from POST - ', response);
            if (response.data == 'success') {
                $location.path('selection');
            }
        });
    };
}]);

//################################################################################
//                          Selection Controller
//################################################################################

app.controller('SelectionController', ['$scope', '$http', 'DataService', function($scope, $http, DataService){
    $scope.dateIt = (1000 * 60 * 60 * 24);

    //########### AJAX call to DB by region #############
    $scope.getList = function() {
        selectedRegion = $scope.region;
        $http.get('/getData/' + selectedRegion).then(function (response) {
            console.log(response.data);
            $scope.parkList = [];
            $scope.parkList = trimmedList(response.data);

            //##### check returned array against selected array to avoid duplication #####
            function trimmedList(responseArray){
                for(var i = 0; i < responseArray.length; i++){
                        var it=0;
                        while(it < $scope.selectedList.length){
                            if(responseArray[i].id == $scope.selectedList[it].id){
                            responseArray.splice(i,1);
                            it=0;} else {
                                it++;
                            }
                        }
                }
                return(responseArray);
            }
        });
    };

    //########## Move chosen location from result array to selected array ###########
    $scope.selectLoc = function(eyeDee) {
        console.log(eyeDee);
        for(var i=0; i < $scope.parkList.length; i++){
            if(eyeDee == $scope.parkList[i].id){
                //console.log($scope.parkList[i]);
                $scope.selectedList.push($scope.parkList.splice(i, 1)[0]);
                //console.log($scope.parkList);
            }
        }
    };

    //########## Move from selected array back to region array ################
    $scope.unSelectLoc = function(eyeDee) {
        //console.log(eyeDee);
        for(var i=0; i < $scope.selectedList.length; i++){
            //######### Determine if current region matches removed or is 'All' ##########
            if(eyeDee == $scope.selectedList[i].id){
                if(($scope.selectedList[i].region == selectedRegion) || selectedRegion == "All"){
                    $scope.parkList.push($scope.selectedList.splice(i, 1)[0]);
                } else {
                    $scope.selectedList.splice(i, 1);
                    //console.log($scope.selectedList);
                }
            }
        }
    };

    //######### Set selected date range when button is clicked ###########
    $scope.setDateRange = function(){
        DataService.startDate = $scope.dateStart;
        DataService.endDate = $scope.dateEnd;
    };
}]);



//################################################################################
//                          Result Controller
//################################################################################

app.controller('ResultController', ['$scope', '$http', 'DataService', function($scope, $http, DataService){

    $scope.startDate = Number(DataService.startDate);
    $scope.endDate = Number(DataService.endDate);

    var returnsArray = [];
    var currentReturn;
    $scope.dailyArray = [];
    $scope.finalArray = [];



    //###### Make call to API for forecast data #######
    var acquireData = function(i, name){
        $http.jsonp('https://api.forecast.io/forecast/760edd936d31e7c58af4820c05f8a327/'+$scope.selectedList[i].lat+','+$scope.selectedList[i].long+'/?exclude=currently,minutely,hourly,alerts,flags&callback=JSON_CALLBACK').then(function(response){
            currentReturn = response.data.daily.data;
            //########### Build a formatted object for each API return and push to an array ############
            var formattedReturn = {
                parkName: name,
                averageTemp: averageTempCalc(),
                averagePrecip: averagePrecipCalc(),
                summaries: addSummaries(),
                dates: addDates(),
                dailyPrecip: dailyPrecip(),
                dailyTemp: dailyTemp()
            };
            returnsArray.push(formattedReturn);
            //####### Check for return count equal to request count ########
            if(returnsArray.length == $scope.selectedList.length){
                sortArray();
            }
        })
    };

    //###### Iterator and loop for unique API calls ########
    for (var i = 0; i < $scope.selectedList.length; i++) {
        acquireData(i, $scope.selectedList[i].name);
    }

    //######## Sort the final array by highest average temperature #########
    function sortArray() {
        returnsArray.sort(sortNumbers);
        //console.log(returnsArray);
        $scope.finalArray = returnsArray;
        buildDailyArray();
    }

    //######### Sorting function ###########
    function sortNumbers(a, b) {
            if (a.averageTemp < b.averageTemp ) {
                return 1;
            }
            if (a.averageTemp > b.averageTemp ) {
                return -1;
            }
            // a must be equal to b
            return 0;
        }


    //##################################################################################
    //        Functions for constructing object with formatted return results
    //##################################################################################

    //############ Calculate average temperature for selected date range ###############
    function averageTempCalc(){
        var tempTotal = 0;
        var tempArray  = currentReturn.slice($scope.startDate, $scope.endDate + 1);
        for(var i = 0; i < tempArray.length; i++){
            tempTotal += tempArray[i].temperatureMax;
        }
        return (tempTotal / tempArray.length);
    }

    //############ Calculate average precipitation for selected date range ###############
    function averagePrecipCalc(){
        var tempTotal = 0;
        var tempArray  = currentReturn.slice($scope.startDate, $scope.endDate + 1);
        for(var i = 0; i < tempArray.length; i++){
            tempTotal += tempArray[i].precipProbability;
        }
        return (tempTotal / tempArray.length);
    }

    //########## Push daily forecast summaries into an array ###############
    function addSummaries() {
        var blurbArray = [];
        var tempArray = currentReturn.slice($scope.startDate, $scope.endDate + 1);
        for (var i = 0; i < tempArray.length; i++) {
            blurbArray.push(tempArray[i].summary);
        }
        return blurbArray;
    }

    //########### Push UNIX dates for selected range into an array #############
    function addDates() {
        var dateArray = [];
        var tempArray = currentReturn.slice($scope.startDate, $scope.endDate + 1);
        for (var i = 0; i < tempArray.length; i++) {
            dateArray.push(tempArray[i].time);
        }
        return dateArray;
    }

    //########### Push daily precipitation percentages for selected range into an array #############
    function dailyPrecip() {
        var precipArray = [];
        var tempArray = currentReturn.slice($scope.startDate, $scope.endDate + 1);
        for (var i = 0; i < tempArray.length; i++) {
            precipArray.push(tempArray[i].precipProbability);
        }
        return precipArray;
    }

    //########### Push daily high temperature for selected range into an array #############
    function dailyTemp() {
        var dailyArray = [];
        var tempArray = currentReturn.slice($scope.startDate, $scope.endDate + 1);
        for (var i = 0; i < tempArray.length; i++) {
            dailyArray.push(tempArray[i].temperatureMax);
        }
        return dailyArray;
    }

    //############ Build array to display daily results by row with ng-repeat ###############
    function buildDailyArray() {
        for (var it = 0; it < 3; it++) {
            var onePark = [];
            for (var i = 0; i < $scope.finalArray[it].dates.length; i++) {
                var oneDay = {
                    summaries: $scope.finalArray[it].summaries[i],
                    dates: $scope.finalArray[it].dates[i],
                    dailyPrecip: $scope.finalArray[it].dailyPrecip[i],
                    dailyTemp: $scope.finalArray[it].dailyTemp[i]
                };

                onePark.push(oneDay);
            }
            $scope.dailyArray.push(onePark);
        }
        console.log('Daily Array', $scope.dailyArray)
    }

}]);




