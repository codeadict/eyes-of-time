/**
 * Created by codeadict on 4/11/15.
 */

(function () {
  (function (window, document, undefined_) {
    "use strict";
    L.VectorMarkers = {};
    L.VectorMarkers.version = "1.0.0";
    L.VectorMarkers.MAP_PIN = 'M16,1 C7.7146,1 1,7.65636364 1,15.8648485 C1,24.0760606 16,51 16,51 C16,51 31,24.0760606 31,15.8648485 C31,7.65636364 24.2815,1 16,1 L16,1 Z';
    L.VectorMarkers.Icon = L.Icon.extend({
      options: {
        iconSize: [30, 50],
        iconAnchor: [15, 50],
        popupAnchor: [2, -40],
        shadowAnchor: [7, 45],
        shadowSize: [54, 51],
        className: "vector-marker",
        prefix: "fa",
        spinClass: "fa-spin",
        extraClasses: "",
        icon: "home",
        markerColor: "blue",
        iconColor: "white"
      },
      initialize: function (options) {
        return options = L.Util.setOptions(this, options);
      },
      createIcon: function (oldIcon) {
        var div, icon, options, pin_path;
        div = (oldIcon && oldIcon.tagName === "DIV" ? oldIcon : document.createElement("div"));
        options = this.options;
        if (options.icon) {
          icon = this._createInner();
        }
        pin_path = L.VectorMarkers.MAP_PIN;
        div.innerHTML = '<svg width="32px" height="52px" viewBox="0 0 32 52" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' + '<path d="' + pin_path + '" fill="' + options.markerColor + '"></path>' + icon + '</svg>';
        this._setIconStyles(div, "icon");
        this._setIconStyles(div, "icon-" + options.markerColor);
        return div;
      },
      _createInner: function () {
        var iconClass, iconColorClass, iconColorStyle, iconSpinClass, options;
        iconClass = void 0;
        iconSpinClass = "";
        iconColorClass = "";
        iconColorStyle = "";
        options = this.options;
        if (options.icon.slice(0, options.prefix.length + 1) === options.prefix + "-") {
          iconClass = options.icon;
        } else {
          iconClass = options.prefix + "-" + options.icon;
        }
        if (options.spin && typeof options.spinClass === "string") {
          iconSpinClass = options.spinClass;
        }
        if (options.iconColor) {
          if (options.iconColor === "white" || options.iconColor === "black") {
            iconColorClass = "icon-" + options.iconColor;
          } else {
            iconColorStyle = "style='color: " + options.iconColor + "' ";
          }
        }
        return "<i " + iconColorStyle + "class='" + options.extraClasses + " " + options.prefix + " " + iconClass + " " + iconSpinClass + " " + iconColorClass + "'></i>";
      },
      _setIconStyles: function (img, name) {
        var anchor, options, size;
        options = this.options;
        size = L.point(options[(name === "shadow" ? "shadowSize" : "iconSize")]);
        anchor = void 0;
        if (name === "shadow") {
          anchor = L.point(options.shadowAnchor || options.iconAnchor);
        } else {
          anchor = L.point(options.iconAnchor);
        }
        if (!anchor && size) {
          anchor = size.divideBy(2, true);
        }
        img.className = "vector-marker-" + name + " " + options.className;
        if (anchor) {
          img.style.marginLeft = (-anchor.x) + "px";
          img.style.marginTop = (-anchor.y) + "px";
        }
        if (size) {
          img.style.width = size.x + "px";
          return img.style.height = size.y + "px";
        }
      },
      createShadow: function () {
        var div;
        div = document.createElement("div");
        this._setIconStyles(div, "shadow");
        return div;
      }
    });
    return L.VectorMarkers.icon = function (options) {
      return new L.VectorMarkers.Icon(options);
    };
  })(this, document);

}).call(this);


//var api_endpoint = "http://eyes-of-time.herokuapp.com";
var api_endpoint = "";


var eyesoftimeApp = angular.module('eyesoftimeApp', [])
  .config(function ($interpolateProvider) {
    $interpolateProvider.startSymbol('[[').endSymbol(']]');
  });
eyesoftimeApp.controller('FindingListController', function ($scope, $http, $interval) {
  $scope.resetEvent = function () {
    $scope.newEvent = {
      lat: null,
      lon: null,
      description: ''
    };
  };

  $scope.resetEvent();

  $scope.map = L.map("map", {
    center: [0, 0],
    attributionControl: false,
    doubleClickZoom: false,
    zoomControl: true,
    fullscreenControl: true,
    zoom: 3,
    maxZoom: 9
  });

  /* GPS enabled geolocation control set to follow the user's location */
  var locateControl = L.control.locate({
    position: "topright",
    drawCircle: true,
    follow: true,
    setView: true,
    keepCurrentZoomLevel: true,
    markerStyle: {
      weight: 1,
      opacity: 0.8,
      fillOpacity: 0.8
    },
    circleStyle: {
      weight: 1,
      clickable: false
    },
    icon: "icon-direction",
    metric: false,
    strings: {
      title: "My location",
      popup: "You are within {distance} {unit} from this point",
      outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
    },
    locateOptions: {
      maxZoom: 5,
      watch: true,
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 10000
    }
  }).addTo($scope.map);

  var layer = L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_CorrectedReflectance_TrueColor/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
    attribution: 'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
    bounds: [
      [-90, -180],
      [90, 180]
    ],
    minZoom: 1,
    maxZoom: 9,
    format: 'jpg',
    time: '2015-04-08',
    tilematrixset: 'GoogleMapsCompatible_Level'
  });

  $scope.map.addLayer(layer);

  $scope.markers = [];

  $scope.$watch('events', function (events_list) {
    if (!events_list) {
      return
    }
    _.each(events_list, function (e) {
      var existing_markers = _.filter($scope.markers, function (m) {
        return m.getLatLng().lat == e.coordinates[0] && m.getLatLng().lon == e.coordinates[1];
      });
      if (!existing_markers.length) {
        var marker = L.marker(e.coordinates, {icon: L.VectorMarkers.icon({icon: 'rocket', prefix: 'fa', markerColor: '#EB0C7B', spin: true})});
        marker.bindPopup(e.description);
        $scope.markers.push(marker);
        marker.addTo($scope.map)
      }
    });
  });

  $scope.toggleSidebar = function () {
    $("#sidebar").toggle();
    $scope.map.invalidateSize();
    return false;
  }

  $scope.showModal = false;

  $scope.onMapClick = function (event) {
    $scope.newEvent.lat = event.latlng.lat;
    $scope.newEvent.lon = event.latlng.lng;
    $scope.toggleModal();
    $scope.$apply();
  };


  $scope.map.on('dblclick', $scope.onMapClick);

  $scope.toggleModal = function () {
    $scope.showModal = !$scope.showModal;
  };

  $scope.registerEvent = function () {
    $http.post(api_endpoint + '/events/', $scope.newEvent, {withCredentials: true}).success(function (result) {
      if (!result.error) {
        $scope.events = result;
        $scope.resetEvent();
        $scope.refreshProfile();
        $scope.toggleModal();
      } else {
        alert(result.error);
      }
    });
  };

  $scope.loadEvents = function () {
    $http.get(api_endpoint + '/events/', {withCredentials: true}).success(function (result) {
      $scope.events = result;
    });
  };

  $scope.loadEvents();
  $interval($scope.loadEvents, 60 * 1000); // 1 minute

  $scope.refreshProfile = function () {
    $http.get('/profile/', {withCredentials: true}).success(function (result) {
      $scope.rating = result.rating;
    });
  };

  $scope.refreshProfile();
  $interval($scope.refreshProfile, 5 * 60 * 1000); // 5 minutes

});

eyesoftimeApp.directive('modal', function () {
  return {
    template: '<div class="modal fade" tabindex="-1" role="dialog">' +
      '<div class="modal-dialog">' +
      '<div class="modal-content">' +
      '<div class="modal-header">' +
      '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
      '<h4 class="modal-title">{{ title }}</h4>' +
      '</div>' +
      '<div class="modal-body" ng-transclude></div>' +
      '</div>' +
      '</div>' +
      '</div>',
    restrict: 'EA',
    transclude: true,
    replace: true,
    scope: true,
    link: function postLink(scope, element, attrs) {
      scope.title = attrs.title;

      scope.$watch(attrs.visible, function (value) {
        if (value == true)
          $(element).modal('show');
        else
          $(element).modal('hide');
      });

      $(element).on('shown.bs.modal', function () {
        scope.$apply(function () {
          scope.$parent[attrs.visible] = true;
        });
      });

      $(element).on('hidden.bs.modal', function () {
        scope.$apply(function () {
          scope.$parent[attrs.visible] = false;
        });
      });
    }
  };
});

