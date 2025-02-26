import React, { useRef, useState, useCallback } from "react";
import { LoadScript, Autocomplete } from "@react-google-maps/api";
import { TextField } from "@mui/material";

const libraries: ("places")[] = ["places"]; // Load only the Places library

// Define types for address info
interface AddressInfo {
  place: google.maps.places.PlaceResult;
  addressComponents: google.maps.GeocoderAddressComponent[] | undefined;
  coordinates: {
    lat: number | undefined;
    lng: number | undefined;
  };
}

const useGooglePlaces = () => {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [addressInfo, setAddressInfo] = useState<AddressInfo | null>(null);

  const handlePlaceChanged = useCallback(() => {
    if (!autocompleteRef.current) {
      console.error("Autocomplete reference is null");
      return;
    }

    const place = autocompleteRef.current.getPlace();
    if (place) {
      console.log(place)
      setAddressInfo({
        place,
        addressComponents: place.address_components,
        coordinates: {
          lat: place.geometry?.location?.lat(),
          lng: place.geometry?.location?.lng(),
        },
      });
    }
  }, []);

  const handleAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete | null) => {
    if (!autocomplete) {
      console.error("Failed to load autocomplete");
      return;
    }
    autocompleteRef.current = autocomplete;
  }, []);

  const AddressForm: React.FC = useCallback(() => (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_API_KEY as string} libraries={libraries}>
      <Autocomplete
        onLoad={handleAutocompleteLoad}
        onPlaceChanged={handlePlaceChanged}
      >
        <TextField
          label="Search Address"
          variant="outlined"
          fullWidth
          placeholder="Start typing an address..."
          onMouseDown={(e) => e.stopPropagation()} // Prevent modal or parent from intercepting events
          onTouchStart={(e) => e.stopPropagation()} // Handle touch on mobile
        />
      </Autocomplete>
    </LoadScript>
  ), [handlePlaceChanged, handleAutocompleteLoad]);

  return { addressInfo, AddressForm };
};

export default useGooglePlaces;
