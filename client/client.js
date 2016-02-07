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

//################################################################################
//                            Main Controller
//################################################################################

app.controller('mainController', ['$scope', '$http', function($scope, $http){
    $scope.sample = 'Angular hooked up correctly';

    //######## Global scope variable holds selected array ##########
    $scope.selectedList = [];

}]);

//################################################################################
//                          Selection Controller
//################################################################################

app.controller('SelectionController', ['$scope', '$http', function($scope, $http){
    $scope.sample = 'Selection Angular hooked up correctly';

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
        console.log(eyeDee);
        for(var i=0; i < $scope.selectedList.length; i++){
            if(eyeDee == $scope.selectedList[i].id){
                if($scope.selectedList[i].region == $scope.parkList[0].region) {
                    $scope.parkList.push($scope.selectedList.splice(i, 1)[0]);
                } else {
                    $scope.selectedList.splice(i, 1);
                    //$scope.selectedList.push($scope.parkList.splice(i, 1)[0]);
                    console.log($scope.selectedList);
                }
            }
        }
    }
}]);

//################################################################################
//                          Result Controller
//################################################################################

app.controller('ResultController', ['$scope', '$http', function($scope, $http){
    $scope.sample = 'Result Angular hooked up correctly';

    acquireData();

    //###### Make call to API for forecast data #######
    function acquireData(){
        $http.jsonp('https://api.forecast.io/forecast/760edd936d31e7c58af4820c05f8a327/'+$scope.selectedList[0].lat+','+$scope.selectedList[0].long+'/?exclude=currently,minutely,hourly,alerts,flags&callback=JSON_CALLBACK').then(function(response){
            $scope.forecastList = response.data.daily.data;
            console.log($scope.forecastList);
        })
    }
}]);




