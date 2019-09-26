
export const getEvents = () => {
    fetch('http://localhost:8080/api/calendars/2/events')
        .then(response => response.json())
        .then(data =>
           {console.log("DATA=" + JSON.stringify(data))})
        .catch(error => console.log(error));
}
