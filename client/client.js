var app = angular.module('campApp', ['ngRoute']);


app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
    $routeProvider
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

//################################################################################
//                            Main Controller
//################################################################################

app.controller('mainController', ['$scope', '$http', 'DataService', function($scope, $http, DataService){
    $scope.sample = 'Angular hooked up correctly';

    //######## Global scope variable holds selected array ##########
    $scope.selectedList = [];

    //######## Global date variable holds today's date ############
    $scope.dateToday = Date.now();

}]);

//################################################################################
//                          Selection Controller
//################################################################################

app.controller('SelectionController', ['$scope', '$http', 'DataService', function($scope, $http, DataService){
    $scope.sample = 'Selection Angular hooked up correctly';
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
                console.log($scope.parkList[i]);
                $scope.selectedList.push($scope.parkList.splice(i, 1)[0]);
                console.log($scope.parkList);
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
    $scope.sample = 'Result Angular hooked up correctly';
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
            if(returnsArray.length == $scope.selectedList.length){
                sortArray();
            }
        })
    };

    //###### Iterator and loop for unique API calls ########
    for (var i = 0; i < $scope.selectedList.length; i++) {
        acquireData(i, $scope.selectedList[i].name);
    }

    function sortArray() {
        returnsArray.sort(sortNumbers);
        console.log(returnsArray);
        $scope.finalArray = returnsArray;
        buildDailyArray();
    }

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

    //########### Push daily precipition percentages for selected range into an array #############
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

    function buildDailyArray() {
        for (var i = 0; i < $scope.finalArray[0].dates.length; i++) {
            var oneDay = {
                summaries: $scope.finalArray[0].summaries[i],
                dates: $scope.finalArray[0].dates[i],
                dailyPrecip: $scope.finalArray[0].dailyPrecip[i],
                dailyTemp: $scope.finalArray[0].dailyTemp[i]
            };

            $scope.dailyArray.push(oneDay);
        }
    }

}]);




