import { useAuth0 } from "../hooks/useAuth0";
import { useMapGrid } from "../hooks/useMapGrid";
import axios from "axios";
import { useEffect } from "react";

export const MapGrid = () => {
    const { setMap, SVGMap } = useMapGrid();
    const { me } = useAuth0();

    useEffect(() => {
        if (!me) {
            return
        }

        axios.get("/services/api/map", {
            headers: {
                Authorization: `Bearer ${me.token}`
            }
        })
        .then(response => {
            setMap(response.data.map)
        })
        .catch(error => {
            console.error(error);
        });



    }, [me]);

    return <SVGMap />;
}
