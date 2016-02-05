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

            //#### check returned array against selected array to avoid duplication ####
            function trimmedList(responseArray){
                for(var i = 0; i < responseArray.length; i++){
                        console.log('for loop working - ', i);
                        var it=0;
                        while(it < $scope.selectedList.length){
                            console.log('while loop - ', it);
                            console.log($scope.selectedList);
                            console.log(responseArray[i].id + "---" + $scope.selectedList[it].id);
                            if(responseArray[i].id == $scope.selectedList[it].id){
                                console.log("MATCH!");
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

    //########## Move selected from result array to selected array ###########
    $scope.selectLoc = function(eyeDee) {
        console.log(eyeDee);
        for(var i=0; i < $scope.parkList.length; i++){
            if(eyeDee == $scope.parkList[i].id){
                console.log($scope.parkList[i]);
                $scope.selectedList.push($scope.parkList.splice(i, 1)[0]);
                console.log($scope.parkList);
            }
        }
    }
}]);

//################################################################################
//                          Result Controller
//################################################################################

app.controller('ResultController', ['$scope', '$http', function($scope, $http){
    $scope.sample = 'Result Angular hooked up correctly';

}]);


