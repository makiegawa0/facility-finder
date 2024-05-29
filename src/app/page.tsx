"use client";

import { useEffect, useState } from "react";
import {
  APIProvider,
  Map as GoogleMap,
  useMapsLibrary,
  useMap,
  AdvancedMarker,
  Pin,
} from "@vis.gl/react-google-maps";

import { Form, Card, Button } from "react-bootstrap";

export default function Intro() {
  const position = { lat: 0, lng: 0 };

  // console.log(process.env.MAP_ID);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          zoom={3}
          center={{ lat: 22.54992, lng: 0 }}
          mapId="DEMO_MAP_ID"
          fullscreenControl={false}
        >
          <Directions />
        </GoogleMap>
      </APIProvider>
    </div>
  );
}

function Directions() {
  const map = useMap();
  const routesLibrary = useMapsLibrary("routes");

  const [directionsService, setDirectionsService] =
    useState<google.maps.DirectionsService>();
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer>();
  const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);
  const [routeIndex, setRouteIndex] = useState<number>();
  const selected = routes[routeIndex!];
  const leg = selected?.legs[0];

  const [places, setPlaces] = useState<
    Map<number, Set<google.maps.places.Place>>
  >(new Map());

  const [origin, setOrigin] = useState(localStorage.getItem("origin") || "");
  const [destination, setDestination] = useState(
    localStorage.getItem("destination") || ""
  );
  const [range, setRange] = useState(500);
  const [faciility, setFacility] = useState("restaurant");
  const [placeName, setPlaceName] = useState("");

  const search = (index: number, place: google.maps.LatLng) => {
    // console.log(place.toJSON());
    nearbySearch(place, range, faciility)
      .then((places) => {
        // console.log(places);
        setPlaces((prevPlaces) => {
          if (!prevPlaces!.has(index)) {
            let newSet = new Set<google.maps.places.Place>();
            places.forEach((place: google.maps.places.Place) => {
              newSet.add(place!);
            });
            prevPlaces!.set(index, newSet);
          } else {
            const placeSet = prevPlaces!.get(index);
            places.forEach((place: google.maps.places.Place) => {
              placeSet!.add(place!);
            });
            prevPlaces!.set(index, placeSet!);
          }
          return prevPlaces;
        });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
    // console.log(final);
  };

  const fetchRoutes = () => {
    if (!directionsService || !directionsRenderer) return;

    directionsService
      .route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
      })
      .then((response) => {
        directionsRenderer.setDirections(response);
        setRoutes(response.routes);
        // console.log(response.routes.length);
        let array: Set<google.maps.LatLng>[] = [];

        response.routes.forEach((route, index) => {
          let paths = new Set(route.overview_path);

          let centreIdx = 0;
          let checkPointIdx = 1;

          const start = route.overview_path[0];
          const end = route.overview_path[route.overview_path.length - 1];

          // console.log(paths.size, route.overview_path[checkPointIdx].toJSON());
          while (checkPointIdx < route.overview_path.length) {
            const checkPoint = route.overview_path[checkPointIdx];
            const centrePoint = route.overview_path[centreIdx];

            if (arePointsNear(checkPoint, centrePoint, range / 1000)) {
              paths.delete(checkPoint);
              checkPointIdx += 1;
            } else {
              centreIdx = checkPointIdx;
              search(index, centrePoint);
              checkPointIdx = centreIdx + 1;
            }
          }
          paths.add(start);
          paths.add(end);
          // console.log(paths.size);
          array.push(paths);
        });
      });
  };

  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map }));
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsRenderer) return;
    return () => directionsRenderer.setMap(null);
  }, [directionsRenderer]);

  useEffect(() => {
    if (!directionsRenderer) return;
    directionsRenderer.setRouteIndex(routeIndex!);
  }, [routeIndex, directionsRenderer]);

  useEffect(() => {
    places.forEach((value, key, map) => {
      console.log(key, value.size);
    });
  }, [places]);

  useEffect(() => {
    localStorage.setItem("origin", origin);
  }, [origin]);

  useEffect(() => {
    localStorage.setItem("destination", destination);
  }, [destination]);

  // if (!leg) return null;

  const colors = ["red", "green", "blue", "orange"];

  return (
    <div>
      <div className="directions">
        <Form>
          <Form.Group className="mb-3" controlId="formOrigin">
            <Form.Label>Origin</Form.Label>
            <Form.Control
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formDestination">
            <Form.Label>Destination</Form.Label>
            <Form.Control
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formFacility">
            <Form.Label>Facility</Form.Label>
            <Form.Control
              value={faciility}
              onChange={(e) => setFacility(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formRange">
            <Form.Label>Range (m)</Form.Label>
            {/* <RangeSlider
              value={range}
              onChange={(e) => setRange(e.target.value)}
              tooltipLabel={(currentRange) => `${currentRange}m`}
              tooltip="on"
            /> */}
            <Form.Control
              value={range}
              onChange={(e) => setRange(Number(e.target.value))}
            />
          </Form.Group>
          <Button onClick={fetchRoutes}>Get Directions</Button>
        </Form>

        <br />
        <Card border="primary">
          <Card.Header>{selected?.summary}</Card.Header>
          <Card.Body>
            {/* <Card.Title>
              {leg.start_address.split(",")[0]} to{" "}
              {leg.end_address.split(",")[0]}
            </Card.Title> */}
            <Card.Text>
              Distance: {leg?.distance?.text}
              <br />
              Duration: {leg?.duration?.text}
              <br />
              Number of Facilities: {places.get(routeIndex!)?.size}
              <br />
              Selected Place: {placeName}
            </Card.Text>
            <h4>Other Routes</h4>
            <ul>
              {routes.map((route, index) => (
                <li key={route.summary}>
                  <button onClick={() => setRouteIndex(index)}>
                    {route.summary}
                  </button>
                </li>
              ))}
            </ul>
          </Card.Body>
        </Card>
      </div>
      {(places.has(routeIndex!)
        ? Array.from(places.get(routeIndex!)!)
        : []
      ).map((place, index) => (
        <AdvancedMarker
          position={place.location!.toJSON()}
          title={"AdvancedMarker with customized pin."}
          onClick={() => setPlaceName(place.displayName!)}
        >
          <Pin
            background={colors[routeIndex!]}
            borderColor={"#1e89a1"}
            glyphColor={"#0f677a"}
          ></Pin>
        </AdvancedMarker>
      ))}
    </div>
  );
}

async function nearbySearch(
  location: google.maps.LatLng,
  range: number,
  type: string
) {
  //@ts-ignore
  const { Place, SearchNearbyRankPreference } =
    (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;

  // Restrict within the map viewport.
  // let center = new google.maps.LatLng(52.369358, 4.889258);

  const request = {
    // required parameters
    fields: ["displayName", "location", "businessStatus"],
    locationRestriction: {
      center: location,
      radius: Number(range),
    },
    // optional parameters
    includedPrimaryTypes: [type],
    maxResultCount: 5,
    rankPreference: SearchNearbyRankPreference.POPULARITY,
  };

  //@ts-ignore
  const { places } = await Place.searchNearby(request); // https://developers-dot-devsite-v2-prod.appspot.com/maps/documentation/javascript/reference/place#SearchNearbyRequest Promise<{places:Array<Place>}>
  // console.log(location, places);

  if (places.length) {
    return places;
  } else {
    console.log("No results");
    return [];
  }
}

function haversine_distance(mk1: any, mk2: any) {
  var R = 3958.8; // Radius of the Earth in miles
  var rlat1 = mk1.position.lat() * (Math.PI / 180); // Convert degrees to radians
  var rlat2 = mk2.position.lat() * (Math.PI / 180); // Convert degrees to radians
  var difflat = rlat2 - rlat1; // Radian difference (latitudes)
  var difflon = (mk2.position.lng() - mk1.position.lng()) * (Math.PI / 180); // Radian difference (longitudes)

  var d =
    2 *
    R *
    Math.asin(
      Math.sqrt(
        Math.sin(difflat / 2) * Math.sin(difflat / 2) +
          Math.cos(rlat1) *
            Math.cos(rlat2) *
            Math.sin(difflon / 2) *
            Math.sin(difflon / 2)
      )
    );
  return d;
}

function arePointsNear(
  checkPoint: google.maps.LatLng,
  centerPoint: google.maps.LatLng,
  km: number
) {
  var ky = 40000 / 360;
  var kx = Math.cos((Math.PI * centerPoint.lat()) / 180.0) * ky;
  var dx = Math.abs(centerPoint.lng() - checkPoint.lng()) * kx;
  var dy = Math.abs(centerPoint.lat() - checkPoint.lat()) * ky;
  return Math.sqrt(dx * dx + dy * dy) <= km;
}
