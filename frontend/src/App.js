/* global google */
import React, {Component} from 'react';
import './App.css';
import * as Utils from './Utils';

class App extends Component {
    state = {
        currentLocation: 'currentLocation', // current location or other location
        canSeach: false,                    // if the input is validate
        tableData: null,                    // store the search result
        favMap: {},                         // store the favorite map, to check whether
                                            // a place is favorite or not
                                            // key is the place_id, value is index + 1 in the array
        favArray: [],                       // store all the favorite item in an array
        keywordBorderStyle: '',             // keyword input: red border or no border
        keywordNotice: true,                // keyword input: valid or not
        locBorderStyle: '',                 // location input: red border or no border
        locNotice: true,                    // location input: valid or  not
        showDetail: false,                  // wheter we should show detail tab
        detail: null,                       // store the current detail data
        reviews: [],                        // store the reviews that are showed
        googleReviews: null,                // store google reviews
        yelpReviews: null,                  // store yelp reviews
        pageIndex: 0,                       // the page index of the result table
        nextPage: undefined,                // if there is a next page, we store the token here
        current: undefined,                 // store the current data(for favorite)
        userLocation: []                    // the user's location
    };

    // for google map service
    map;
    marker;
    placeService;
    directionsService;
    directionsDisplay;

    // do the initialization here
    componentDidMount() {
        // init the google map
        let uluru = {lat: -25.363, lng: 131.044};

        // create a map
        this.map = new google.maps.Map(document.getElementById('gMap'), {
            zoom: 17,
            center: uluru
        });

        // set a marker
        this.marker = new google.maps.Marker({
            position: uluru,
            map: this.map
        });

        // direction service
        this.directionsService = new google.maps.DirectionsService();
        this.directionsDisplay = new google.maps.DirectionsRenderer({
            map: this.map,
            panel: document.getElementById('gRoutes')
        });
        this.directionsDisplay.setMap(this.map);

        // place service
        this.placeService = new google.maps.places.PlacesService(this.map);
        //init the autocomplete
        new google.maps.places.Autocomplete(
            document.getElementById('inputKeyword'), {});
        new google.maps.places.Autocomplete(
            document.getElementById('inputlocation'), {});

        // get user location
        Utils.getLocation().then(d => {
            this.setState({
                userLocation: d
            });
        });

        // get favorite data
        if (localStorage.getItem('favMap') !== null) {
            this.setState({
                favArray: JSON.parse(localStorage.getItem('favArray')),
                favMap: JSON.parse(localStorage.getItem('favMap'))
            })
        }
    }

    // pagination: go to the previous page
    getPreviousPage = () => {
        this.setState({
            pageIndex: this.state.pageIndex - 1
        });
    };

    // pagination: go to the next page
    getNextPage = () => {
        if (this.state.tableData && this.state.tableData.length > 1 + this.state.pageIndex) {
            // if we have already get the next page
            this.setState({
                pageIndex: this.state.pageIndex + 1
            });
        } else {
            // if we do not have next page, we need to make a AJAX call and get the table
            let that = this;
            let query = {page: this.state.nextPage};
            Utils.page(query).then(res => {
                // parse the result and put into table
                if (res.status === "INVALID_REQUEST") {
                    that.getNextPage();
                } else {
                    let d = res.results;
                    let table = this.state.tableData;
                    let cur = [];
                    for (let k in d) {
                        cur.push({
                            "icon": d[k].icon,
                            "name": d[k].name,
                            "vicinity": d[k].vicinity,
                            "pid": d[k].place_id
                        })
                    }
                    table.push(cur);

                    // set the states
                    that.setState({
                        pageIndex: this.state.pageIndex + 1,
                        nextPage: res.next_page_token,
                        tableData: table,
                        showDetail: false
                    });
                }

            })
        }
    };

    // when the user click search
    onSearch = () => {
        let key = document.getElementById("inputKeyword").value.trim();
        let cat = document.getElementById("category").value;
        let miles = document.getElementById("inputDistance").value;
        miles = miles === "" ? 10 : miles;
        let radius = miles * 1609.34;
        let msg = {};
        if (this.state.currentLocation === "currentLocation") {
            // if the user choose to use his current location
            msg = {
                "keyword": key,
                "type": cat,
                "radius": radius,
                "location": this.state.userLocation[0] + "," + this.state.userLocation[1]
            };
        } else {
            // if the user choose to user other location
            msg = {
                "keyword": key,
                "type": cat,
                "radius": radius,
                "other": document.getElementById("inputlocation").value
            };
        }
        let that = this;
        // make an AJAX call and get the first page data
        Utils.search(msg).then(res => {
            let d = res.results;
            let table = [];
            for (let k in d) {
                table.push({
                    "icon": d[k].icon,
                    "name": d[k].name,
                    "vicinity": d[k].vicinity,
                    "pid": d[k].place_id
                })
            }
            that.setState({
                nextPage: res.next_page_token,
                tableData: [table],
                showDetail: false,
                pageIndex: 0
            });
        });
    };

    // change between "current location" and "other"
    changeLocation = (e) => {
        this.setState({
            currentLocation: e.target.value
        });
        let keyValid = document.getElementById("inputKeyword").value.trim() !== "";
        if (e.target.value === "other") {
            this.setState({
                canSeach: keyValid && (document.getElementById("inputlocation").value.trim() !== "")
            });
        } else {
            this.setState({
                canSeach: keyValid,
                locNotice: true,
                locBorderStyle: ''
            });
        }
    };

    // check if the keyword input and location input is valid or not
    // and update the states
    checkValidation = (e) => {
        let keyValid = document.getElementById("inputKeyword").value.trim() !== "";
        let locValid = this.state.currentLocation === 'other' ?
            document.getElementById("inputlocation").value.trim() !== "" : true;

        // for search button
        if (keyValid && locValid) {
            this.setState({
                canSeach: true,
            });
        } else {
            this.setState({
                canSeach: false,
            });
        }
        // for keyword input box
        if (keyValid) {
            this.setState({
                keywordBorderStyle: '',
                keywordNotice: true
            });
        } else {
            this.setState({
                keywordBorderStyle: '2px solid red',
                keywordNotice: false
            });
        }
        // for location input box
        if (locValid) {
            this.setState({
                locBorderStyle: '',
                locNotice: true
            });
        } else {
            this.setState({
                locBorderStyle: '2px solid red',
                locNotice: false
            });
        }
    };

    // get the detail information of the choosen place
    onGetDetail(t) {
        let that = this;
        this.placeService.getDetails({placeId: t.pid}, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                // set price level
                let pl = "", num = place.price_level;
                while (num > 0) {
                    num--;
                    pl += "$";
                }
                place.price_level = pl;
                // set hours
                let h;
                if (place.opening_hours) {
                    if (place.opening_hours.open_now) {
                        h = "Open now:";
                        let day = new Date().getDay();
                        let str = place.opening_hours.weekday_text[day - 1];
                        h += str.substring(str.indexOf(" "));
                    } else {
                        h = "Closed"
                    }
                }

                // set review times
                if (place.reviews) {
                    for (let i = 0; i < place.reviews.length; i++) {
                        let t = place.reviews[i].time * 1000;
                        let date = new Date(t);
                        place.reviews[i].time = date.getFullYear() + "-" + date.getMonth()
                            + "-" + date.getDate() + " " + date.getHours() + ":"
                            + date.getMinutes() + ":" + date.getSeconds()
                    }
                }

                that.setState({
                    showDetail: true,
                    detail: place,
                    hours: h,
                    reviews: place.reviews,
                    googleReviews: place.reviews,
                    current: t
                });

                document.getElementById("mapTo").value = place.formatted_address;
            }
        });
    };

    // when click get directino, we use Google direction service to get the routes
    onGetDirection = () => {
        let from = document.getElementById("mapFrom").value;
        if (from.toLowerCase() === "my location") from = {
            lat: this.state.userLocation[0],
            lng: this.state.userLocation[1]
        };
        let query = {
            origin: from,
            destination: this.state.detail.geometry.location,
            travelMode: document.getElementById("travelMode").value,
            provideRouteAlternatives: true
        };
        let that = this;
        this.directionsService.route(query, function (result, status) {
            if (status === 'OK') {
                that.directionsDisplay.setDirections(result);
            }
        });
    };

    // upon click the clear button
    onClear = () => {
        // clear up the input values
        document.getElementById("inputKeyword").value = "";
        document.getElementById("category").value = "";
        document.getElementById("inputDistance").value = "";
        document.getElementById("inputlocation").value = "";
        // reset the states, except for the favorite data
        this.setState({
            currentLocation: 'currentLocation',
            canSeach: false,
            tableData: null,
            keywordBorderStyle: '',
            keywordNotice: true,
            locBorderStyle: '',
            locNotice: true,
            showDetail: false,
            detail: null,
            reviews: [],
            googleReviews: null,
            yelpReviews: null,
            pageIndex: 0,
            nextPage: undefined,
            current: undefined,
        });
    };

    // deal with the map tab differently
    // google map seems to not work well in the Bootstrap navs,
    // so we use a new div and use display to control the visibility
    changeTab = (t) => {
        if (t === 'map') {
            // create the google map
            new google.maps.places.Autocomplete(
                document.getElementById('mapFrom'), {});
            document.getElementById("gMap").style.display = "";
            document.getElementById("gRoutes").style.display = "";
            google.maps.event.trigger(this.map, 'resize'); // !important
            let loc = this.state.detail.geometry.location;
            this.map.setCenter(loc);
            this.marker.setPosition(loc);
        } else {
            document.getElementById("gMap").style.display = "none";
            document.getElementById("gRoutes").style.display = "none";
        }
    };

    // change the reviews between yelp and google
    changeReviews = (t) => {
        if (t.target.value === 'yelp') {
            // make a request to the backend
            if (this.state.yelpReviews === null) {
                let detail = this.state.detail;
                let city, state, country;
                for (let i in detail.address_components) {
                    let addr = detail.address_components[i];
                    if (addr.types[0] === "locality") {
                        city = addr.long_name;
                    } else if (addr.types[0] === "administrative_area_level_1") {
                        state = addr.short_name;
                    } else if (addr.types[0] === "country") {
                        country = addr.short_name
                    }
                }
                let data = {
                    "name": detail.name,
                    "city": city,
                    "state": state,
                    "country": country
                };
                Utils.yelp(data).then(d => {
                    if (d.reviews) {
                        let review = d.reviews.map((t, i) => ({
                            profile_photo_url: t.user.image_url,
                            author_name: t.user.name,
                            author_url: t.url,
                            rating: t.rating,
                            time: t.time_created,
                            text: t.text
                        }));
                        this.setState({
                            yelpReviews: review,
                            reviews: review
                        });
                    } else {
                        this.setState({
                            yelpReviews: [],
                            reviews: []
                        });
                    }
                });
            } else {
                this.setState({
                    reviews: this.state.yelpReviews
                })
            }
        } else {
            this.setState({
                reviews: this.state.googleReviews
            })
        }
    };

    // when select different order of the reviews, we change the order here
    changeOrder = (t) => {
        let rv = this.state.reviews;
        if (t.target.value === 'defaultOrder') {
            let gOrY = document.getElementById("gOrY").value;
            if (gOrY === "yelp") {
                this.setState({reviews: this.state.yelpReviews});
            } else {
                this.setState({reviews: this.state.googleReviews});
            }
        } else if (t.target.value === 'highestRating') {
            this.setState({
                reviews: rv.sort((a, b) => {
                    return b.rating - a.rating;
                })
            });
        } else if (t.target.value === 'lowestRating') {
            this.setState({
                reviews: rv.sort((a, b) => {
                    return a.rating - b.rating;
                })
            });
        } else if (t.target.value === 'mostRecent') {
            this.setState({
                reviews: rv.sort((a, b) => {
                    return new Date(b.time) - new Date(a.time);
                })
            });
        } else {
            this.setState({
                reviews: rv.sort((a, b) => {
                    return new Date(a.time) - new Date(b.time);
                })
            });
        }
    };

    // post the twitter
    twiiter = () => {
        let text = "Check out " + this.state.detail.name + " located at " + this.state.detail.formatted_address
            + ". Website: " + (this.state.detail.website ? this.state.detail.website : this.state.detail.url);
        let url = "https://twitter.com/intent/tweet?text=" + encodeURI(text) + "%20%23TravelAndEntertainmentSearch";
        window.open(url);
    };

    // add to favorite list or remove from the favorite list
    updateFav = (t) => {
        let array = this.state.favArray;
        let map = this.state.favMap;
        if (this.state.favMap[t.pid]) { // remove from favorite
            // update the former last item
            map[array[array.length - 1].pid] = map[t.pid];
            // exchange the last item with the one we want to delete
            array[map[t.pid] - 1] = array[array.length - 1];
            // remove the last one
            array.splice(-1, 1);
            // remove the key
            delete map[t.pid];
        } else {    // add to favorite
            array.push(t);
            map[t.pid] = array.length;
        }
        this.setState({
            favArray: array,
            favMap: map
        });

        // store to the local storage
        localStorage.setItem('favArray', JSON.stringify(this.state.favArray));
        localStorage.setItem('favMap', JSON.stringify(this.state.favMap));
    };

    // html part
    render() {
        return (
            <div className="App">
                { //the search form
                }
                <div className="jumbotron">
                    <h3 align="center">Traverl and Entertainment Search</h3>
                    <form>
                        <div className="form-group row">
                            <label className="col-sm-2 col-form-label">Keyword<label className="red">*</label></label>
                            <div className="col-sm-10">
                                <input type="text" className="form-control" id="inputKeyword"
                                       onBlur={this.checkValidation}
                                       style={{border: this.state.keywordBorderStyle}}/>
                                <p style={{color: 'red'}} hidden={this.state.keywordNotice}>Please enter a keyword.</p>
                            </div>
                        </div>
                        <div className="form-group row">
                            <label className="col-sm-2 col-form-label">Category</label>
                            <div className="col-sm-6">
                                <select className="form-control" id="category">
                                    <option value="">Default</option>
                                    <option value="airport">Airport</option>
                                    <option value="amusement_park">Amusement Park</option>
                                    <option value="aquarium">Aquarium</option>
                                    <option value="art_gallery">Art Gallery</option>
                                    <option value="bakery">Bakery</option>
                                    <option value="bar">Bar</option>
                                    <option value="beauty_salon">Beauty Salon</option>
                                    <option value="bowling_alley">Bowling Alley</option>
                                    <option value="bus_station">Bus Station</option>
                                    <option value="cafe">Cafe</option>
                                    <option value="campground">Campground</option>
                                    <option value="car_rental">Car Rental</option>
                                    <option value="casino">Casino</option>
                                    <option value="lodging">Lodging</option>
                                    <option value="movie_theater">Movie Theater</option>
                                    <option value="night_club">Night Club</option>
                                    <option value="park">Park</option>
                                    <option value="parking">Parking</option>
                                    <option value="restaurant">Restaurant</option>
                                    <option value="shopping_mall">Shopping Mall</option>
                                    <option value="stadium">Stadium</option>
                                    <option value="subway_station">Subway Station</option>
                                    <option value="taxi_stand">Taxi Stand</option>
                                    <option value="train_station">Train Station</option>
                                    <option value="transit_station">Transit Station</option>
                                    <option value="travel_agency">Travel Agency</option>
                                    <option value="zoo">Zoo</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group row">
                            <label className="col-sm-2 col-form-label">Distance(miles)</label>
                            <div className="col-sm-6">
                                <input type="text" className="form-control" id="inputDistance" placeholder="10"/>
                            </div>
                        </div>
                        <div className="form-group row">
                            <label className="col-sm-2 col-form-label">From<label className="red">*</label></label>
                            <div className="col-sm-10">
                                <div className="form-check">
                                    <input className="form-check-input" type="radio"
                                           id="currentLocationCheck" value="currentLocation"
                                           checked={this.state.currentLocation === "currentLocation"}
                                           onChange={this.changeLocation}/>
                                    <label className="form-check-label">
                                        Current location
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input className="form-check-input" type="radio"
                                           id="otherCheck" value="other"
                                           checked={this.state.currentLocation === "other"}
                                           onChange={this.changeLocation}/>
                                    <label className="form-check-label">
                                        Other. Please specify:
                                    </label>
                                    <input type="text" className="form-control" id="inputlocation"
                                           placeholder="Enter a location"
                                           style={{border: this.state.locBorderStyle}}
                                           disabled={this.state.currentLocation === "currentLocation"}
                                           onBlur={this.checkValidation}/>
                                    <p hidden={this.state.locNotice} style={{color: 'red'}}>Please enter a keyword.</p>
                                </div>
                            </div>
                        </div>
                        <button type="button" className="btn btn-primary" disabled={!this.state.canSeach}
                                onClick={this.onSearch}>
                            Search
                        </button>
                        <button type="button" className="btn btn-default" onClick={this.onClear}>
                            Clear
                        </button>
                    </form>
                </div>

                {
                    // nav bar
                }
                <ul className="nav nav-pills" style={{paddingBottom: '20px'}}>
                    <li className="nav-item">
                        <a className="nav-link active" data-toggle="tab" href="#result"
                           onClick={() => this.setState({showDetail: false, detail: null})}>Results</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" data-toggle="tab" href="#favorite"
                           onClick={() => this.setState({showDetail: false, detail: null})}>Favorites</a>
                    </li>
                </ul>

                <div className="tab-content" id="myTabContent">
                    {
                        // results tab
                    }
                    <div className="tab-pane show active" id="result">
                        {
                            this.state.tableData && this.state.tableData[this.state.pageIndex].length == 0 && (
                                <div>
                                    <br/><br/><br/><br/>
                                    <div className="alert alert-warning" role="alert">
                                        No Records!
                                    </div>
                                </div>
                            )
                        }
                        {
                            this.state.tableData && !this.state.showDetail
                            && this.state.tableData.length > this.state.pageIndex
                            && this.state.tableData[this.state.pageIndex].length > 0 && (<div id="list">
                                <div style={{width: '90%', textAlign: 'right'}}>
                                    <button type="button" className="btn btn-default"
                                            disabled={this.state.detail === null}
                                            onClick={() => this.setState({showDetail: true})}>
                                        Details
                                        <span className="fa fa-chevron-right" aria-hidden="true"/>
                                    </button>
                                </div>
                                <div className="table-responsive">
                                    <table className="table">
                                        <tbody>
                                        <tr>
                                            <th>#</th>
                                            <th>Category</th>
                                            <th>Name</th>
                                            <th>Address</th>
                                            <th>Favorite</th>
                                            <th>Details</th>
                                        </tr>
                                        {
                                            this.state.tableData[this.state.pageIndex].map((t, i) => (
                                                <tr key={t.pid}>
                                                    <td>{i + 1}</td>
                                                    <td>
                                                        <img src={t.icon} style={{width: '50%'}} alt="No icon"/>
                                                    </td>
                                                    <td>{t.name}</td>
                                                    <td>{t.vicinity}</td>
                                                    <td>
                                                        <button type="button" className="btn btn-default"
                                                                onClick={() => this.updateFav(t)}>
                                                        <span
                                                            className={this.state.favMap[t.pid] ? "fa fa-star yellow" : "far fa-star"}
                                                            aria-hidden="true"/>
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <button type="button" className="btn btn-default"
                                                                onClick={() => this.onGetDetail(t)}>
                                                                <span className="fa fa-chevron-right"
                                                                      aria-hidden="true"/>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                        </tbody>
                                    </table>
                                </div>


                                <div style={{textAlign: 'center'}}>
                                    <button type="button" className="btn btn-default"
                                            hidden={this.state.pageIndex === 0}
                                            onClick={this.getPreviousPage}>
                                        Previous
                                    </button>
                                    <button type="button" className="btn btn-default"
                                            hidden={this.state.nextPage === undefined && this.state.pageIndex + 1 === this.state.tableData.length}
                                            onClick={this.getNextPage}>
                                        Next
                                    </button>
                                </div>
                            </div>)
                        }
                    </div>

                    {
                        // favorites tab
                    }
                    <div className="tab-pane" id="favorite">
                        {
                            this.state.favArray.length !== 0 && !this.state.showDetail && (
                                <div>
                                    <div style={{width: '90%', textAlign: 'right'}}>
                                        <button type="button" className="btn btn-default"
                                                disabled={this.state.detail === null}
                                                onClick={() => this.setState({showDetail: true})}>
                                            Details
                                            <span className="fa fa-chevron-right" aria-hidden="true"/>
                                        </button>
                                    </div>

                                    <div className="table-responsive">
                                        <table className="table">
                                            <tbody>
                                            <tr>
                                                <th>#</th>
                                                <th>Category</th>
                                                <th>Name</th>
                                                <th>Address</th>
                                                <th>Favorite</th>
                                                <th>Details</th>
                                            </tr>
                                            {
                                                this.state.favArray.map((t, i) => (
                                                    <tr key={t.pid}>
                                                        <td>{i + 1}</td>
                                                        <td>
                                                            <img src={t.icon} style={{width: '50%'}} alt="No icon"/>
                                                        </td>
                                                        <td>{t.name}</td>
                                                        <td>{t.vicinity}</td>
                                                        <td>
                                                            <button type="button" className="btn btn-default"
                                                                    onClick={() => this.updateFav(t)}>
                                                                <span className="fa fa-trash" aria-hidden="true"/>
                                                            </button>
                                                        </td>
                                                        <td>
                                                            <button type="button" className="btn btn-default"
                                                                    onClick={() => this.onGetDetail(t)}>
                                                                <span className="fa fa-chevron-right"
                                                                      aria-hidden="true"/>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            }
                                            </tbody>
                                        </table>
                                    </div>

                                </div>)
                        }
                    </div>
                </div>

                {
                    // detail tab
                }
                {
                    this.state.detail && this.state.showDetail && (
                        <div id="detail">
                            <div style={{textAlign: 'center'}}>
                                <h4>{this.state.detail.name}</h4>
                            </div>
                            <div>
                                <button type="button" className="btn btn-default"
                                        onClick={() => this.setState({showDetail: false})}>
                                    <span className="fa fa-chevron-left" aria-hidden="true"/>
                                    List
                                </button>
                                <button type="button" className="btn btn-default"
                                        onClick={() => this.updateFav(this.state.current)}>
                                            <span
                                                className={this.state.favMap[this.state.current.pid] ? "fa fa-star yellow" : "far fa-star"}
                                                aria-hidden="true"/>
                                </button>
                                <button type="button" className="btn btn-default"
                                        onClick={this.twiiter}>
                                    <img style={{width: '20px'}} src="./assets/Twitter.png" alt=""/>
                                </button>
                            </div>
                            <ul className="nav nav-tabs" style={{width: '100%'}}>
                                <li className="nav-item">
                                    <a className="nav-link active" data-toggle="tab"
                                       href="#info" onClick={() => this.changeTab('info')}>Info</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link" data-toggle="tab" href="#photos"
                                       onClick={() => this.changeTab('photos')}>Photos</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link" data-toggle="tab" href="#map"
                                       onClick={() => this.changeTab('map')}>Map</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link" data-toggle="tab"
                                       href="#reviews"
                                       onClick={() => this.changeTab('reviews')}>Reviews</a>
                                </li>
                            </ul>

                            <div className="tab-content">
                                <div className="tab-pane show active" id="info">
                                    <div className="container">
                                        {/*info tab*/}
                                        <div className="info-tab">
                                            <div className="table-responsive">
                                                <table className="table table-striped">
                                                    <tbody>
                                                    <tr>
                                                        <th>Address</th>
                                                        <td>{this.state.detail.formatted_address}</td>
                                                    </tr>
                                                    {
                                                        this.state.detail.international_phone_number && (
                                                            <tr>
                                                                <th>Phone Number</th>
                                                                <td>{this.state.detail.international_phone_number}</td>
                                                            </tr>
                                                        )
                                                    }
                                                    {
                                                        this.state.detail.price_level && (
                                                            <tr>
                                                                <th>Price Level</th>
                                                                <td>{this.state.detail.price_level}</td>
                                                            </tr>
                                                        )
                                                    }
                                                    {
                                                        this.state.detail.rating && (
                                                            <tr>
                                                                <th>Rating</th>
                                                                <td>{this.state.detail.rating}
                                                                    <span className="star"
                                                                          style={{width: (this.state.detail.rating * 15) + "px"}}/>
                                                                </td>
                                                            </tr>
                                                        )
                                                    }
                                                    {
                                                        this.state.detail.url && (
                                                            <tr>
                                                                <th>Google Page</th>
                                                                <td><a target="_blank"
                                                                       href={this.state.detail.url}>{this.state.detail.url}</a>
                                                                </td>
                                                            </tr>
                                                        )
                                                    }
                                                    {
                                                        this.state.detail.website && (
                                                            <tr>
                                                                <th>Website</th>
                                                                <td><a target="_blank"
                                                                       href={this.state.detail.website}>{this.state.detail.website}</a>
                                                                </td>
                                                            </tr>
                                                        )
                                                    }
                                                    {
                                                        this.state.hours && (
                                                            <tr>
                                                                <th>Hours</th>
                                                                <td>{this.state.hours}&nbsp;&nbsp;&nbsp;&nbsp;
                                                                    <a href="#" data-toggle="modal"
                                                                       data-target="#exampleModalCenter">Daily
                                                                        open hours</a></td>
                                                            </tr>
                                                        )
                                                    }
                                                    </tbody>
                                                </table>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                                <div className="tab-pane" id="photos">
                                    {
                                        (this.state.detail.photos === undefined || this.state.detail.photos.length === 0) && (
                                            <div>
                                                <br/><br/><br/><br/>
                                                <div className="alert alert-warning" role="alert">
                                                    No Records!
                                                </div>
                                            </div>
                                        )
                                    }
                                    <div className="container">
                                        <div className="row">
                                            {
                                                [0, 1, 2, 3].map(index => (
                                                    <div className="col-sm-3"
                                                         style={{
                                                             paddingLeft: '0px',
                                                             paddingRight: '0px'
                                                         }}
                                                         key={index}>
                                                        {
                                                            this.state.detail.photos && this.state.detail.photos.filter((t, i) => {
                                                                return i % 4 === index;
                                                            }).map((t, i) => (
                                                                <div className="card" key={i}>
                                                                    <a target="_blank"
                                                                       href={t.getUrl({
                                                                           'maxWidth': 1000,
                                                                           'maxHeight': 1000
                                                                       })}>
                                                                        <div className="card-body">
                                                                            <img src={t.getUrl({
                                                                                'maxWidth': 1000,
                                                                                'maxHeight': 1000
                                                                            })} alt=""/>
                                                                        </div>
                                                                    </a>
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                ))
                                            }
                                        </div>

                                    </div>
                                </div>
                                <div className="tab-pane" id="map">
                                    <div className="container">
                                        <div className="row">
                                            <div className="col-sm-4">
                                                <label className="col-sm-12 col-form-label">From</label>
                                                <div className="col-sm-12">
                                                    <input id="mapFrom" type="text"
                                                           className="form-control"
                                                           placeholder="Your Location"/>
                                                </div>
                                            </div>
                                            <div className="col-sm-4">
                                                <label className="col-sm-12 col-form-label">To</label>
                                                <div className="col-sm-12">
                                                    <input id="mapTo" type="text"
                                                           className="form-control"
                                                           disabled
                                                           placeholder="xxx"/>
                                                </div>
                                            </div>
                                            <div className="col-sm-2">
                                                <label className="col-sm-12 col-form-label">Travel
                                                    Mode</label>
                                                <div className="col-sm-12">
                                                    <select className="form-control" id="travelMode">
                                                        <option value="DRIVING">Driving</option>
                                                        <option value="BICYCLING">Bicycling</option>
                                                        <option value="TRANSIT">Transit</option>
                                                        <option value="WALKING">Walking</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-sm-2">
                                                <br/>
                                                <button className="btn btn-primary"
                                                        onClick={this.onGetDirection}>Get
                                                    Directions
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="tab-pane" id="reviews">
                                    <div className="container">
                                        <div className="row">
                                            <select className="form-control col-sm-2 goy" id="gOrY"
                                                    onChange={this.changeReviews}>
                                                <option value="google">Google Reviews</option>
                                                <option value="yelp">Yelp Reviews</option>
                                            </select>
                                            <select className="form-control col-sm-2 sort"
                                                    onChange={this.changeOrder}>
                                                <option value="defaultOrder">Default Order</option>
                                                <option value="highestRating">Highest Rating</option>
                                                <option value="lowestRating">Lowest Rating</option>
                                                <option value="mostRecent">Most Recent</option>
                                                <option value="leastRecent">Least Recent</option>
                                            </select>
                                        </div>
                                        {
                                            this.state.reviews && this.state.reviews.map((t, i) => (
                                                <div className="card" key={i}>
                                                    <div className="card-body row">
                                                        <div className="col-3 col-sm-1">
                                                            <img src={t.profile_photo_url} alt=""/>
                                                        </div>
                                                        <div className="col-9 col-sm-11">
                                                            <a target="_blank"
                                                               href={t.author_url}>{t.author_name}</a><br/>
                                                            <span className="star"
                                                                  style={{width: (t.rating * 15) + "px"}}/>
                                                            &nbsp;&nbsp;&nbsp;{t.time} <br/> {t.text}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                        {
                                            (this.state.reviews === undefined || this.state.reviews.length === 0) && (
                                                <div>
                                                    <br/><br/><br/><br/>
                                                    <div className="alert alert-warning" role="alert">
                                                        No Records!
                                                    </div>
                                                </div>
                                            )
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    // google map and google routes
                }
                <div id="gMap" style={{display: "none"}}/>
                <div id="gRoutes" style={{display: "none"}}/>


                {
                    // pop up window for daily hours
                }
                <div className="modal fade" id="exampleModalCenter" role="dialog"
                     aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="exampleModalLongTitle">Open hours</h5>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                {
                                    this.state.detail && this.state.detail.opening_hours &&
                                    this.state.detail.opening_hours.weekday_text && (
                                        this.state.detail.opening_hours.weekday_text.map((t, i) => (
                                            <div key={i}>
                                                <hr/>
                                                {
                                                    (new Date().getDay() === i + 1) && (
                                                        <b>&nbsp;&nbsp;{t}</b>
                                                    )
                                                }
                                                {
                                                    (new Date().getDay() !== i + 1) && (
                                                        <p>&nbsp;&nbsp;{t}</p>
                                                    )
                                                }
                                            </div>
                                        ))
                                    )
                                }
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
