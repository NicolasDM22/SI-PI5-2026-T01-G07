export type RootStackParamList = {
  FlightDetail: { flightId: string };
  AlertDetail: { alertId: string };
  LiveFlight: undefined;
  LiveFlightImages: { flightId: string };
};

export type TabParamList = {
  Home: undefined;
  Flights: undefined;
  Upload: undefined;
  Settings: undefined;
};
