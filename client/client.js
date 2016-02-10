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

    //###### Make call to API for forecast data #######
    var acquireData = function(i, name){
        $http.jsonp('https://api.forecast.io/forecast/760edd936d31e7c58af4820c05f8a327/'+$scope.selectedList[i].lat+','+$scope.selectedList[i].long+'/?exclude=currently,minutely,hourly,alerts,flags&callback=JSON_CALLBACK').then(function(response){
            currentReturn = response.data.daily.data;
            //Build an object
            var formattedReturn = {
                parkName: name,
                averageTemp: averageTempCalc(),
                averagePrecip: averagePrecipCalc(),
                summary: addSummaries()
            };
            returnsArray.push(formattedReturn);
            console.log(returnsArray);
        })
    };

    //###### Iterator and loop for unique API calls ########
    for (var i = 0; i < $scope.selectedList.length; i++) {
        acquireData(i, $scope.selectedList[i].name);
    }

    //Build an object
    //Select appropriate range
    //Add park name
    //Do the maths - average high temp
    function averageTempCalc(){
        var tempTotal = 0;
        var tempArray  = currentReturn.slice($scope.startDate, $scope.endDate + 1);
        for(var i = 0; i < tempArray.length; i++){
            tempTotal += tempArray[i].temperatureMax;
            console.log('TEMPERATURE', tempArray[i].temperatureMax);
        }
        return (tempTotal / tempArray.length);
    }
    //Do the maths - average precip %
    function averagePrecipCalc(){
        var tempTotal = 0;
        var tempArray  = currentReturn.slice($scope.startDate, $scope.endDate + 1);
        for(var i = 0; i < tempArray.length; i++){
            tempTotal += tempArray[i].precipProbability;
            console.log('PRECIP', tempArray[i].precipProbability);
        }
        return (tempTotal / tempArray.length);
    }
    //Summary blurb
    function addSummaries() {
        var blurbArray = [];
        var tempArray = currentReturn.slice($scope.startDate, $scope.endDate + 1);
        for (var i = 0; i < tempArray.length; i++) {
            blurbArray.push(tempArray[i].summary);
        }
        return blurbArray;
        //Push it (real good)
    }


}]);




