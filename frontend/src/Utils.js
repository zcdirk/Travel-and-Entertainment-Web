const location_url = "http://ip-api.com/json";
const host = "http://localhost:8081";
const search_url = host + "/search";
const detail_url = host + "/detail";
const yelp_url = host + "/yelp";
const page_url = host + "/page";

// get current user location
export const getLocation = () =>
    fetch(location_url, {})
        .then(res => res.json())
        .then(data => [data.lat, data.lon]);

// search for the result tables
export const search = (query) =>
    fetch(search_url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(query)
    }).then(res => res.json());

// get the detail information of a place
export const detail = (query) =>
    fetch(detail_url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(query)
    }).then(res => res.json());

// get the yelp reviews
export const yelp = (query) =>
    fetch(yelp_url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(query)
    }).then(res => res.json());

// get the next page of the results
export const page = (query) =>
    fetch(page_url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(query)
    }).then(res => res.json());

