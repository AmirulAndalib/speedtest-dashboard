<img src="./public/banner.png" style="width: auto; max-height: 400px; position: relative; left: 50%; transform: translate(-50%, 0);">

# [Dhaka Speed Map](https://speedmap.zzzzion.com/): User reported internet speeds in Dhaka

This project aggregates speed test results submitted by visitors on the site.
The goal is to map out the difference between speeds advertised by ISPs and the
actual speeds experienced by users.

## Dashboard

Google Maps embedded with markers for each speed test result. The markers are
color coded based on the speed test result.

### Data

Data is stored and retrieved from Firebase Firestore.

```ts
export type SpeedPoint = {
  key: string;
  isp: string; // User's Internet Service Provider
  advertised: number; // Advertised speed in Mbps
  download: number; // Reported download speed in Mbps
  upload: number; // Reported upload speed in Mbps
  lat: number; // Latitude
  lng: number; // Longitude
  note: string; // Additional feedback
};
```

### Speed Test

A 30 MB file is hosted on a GitHub Pages site with a custom domain. The custom
domain allows CORS requests, which is necessary for the speed test to work.

```ts
const response = await fetch(
  `https://speed-test-files.zzzzion.com/data-30-mb.txt?timestamp=${Date.now()}`
);
const downloadData = await response.blob(); // Get the file as a Blob
```

The fetch request is timed to measure the download speed.

The same file is then uploaded to a Cloudflare Worker, hosted at
[speed-test-upload.zzzzion.workers.dev](https://speed-test-upload.zzzzion.workers.dev/).

```js
addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method === "POST") {
    const formData = await request.formData();
    const file = formData.get("file");
    return new Response("File uploaded and processed", { status: 200 });
  }
  return new Response("Method not allowed", { status: 405 });
}
```

This measures the time it takes to upload the file to Cloudflare's Edge network.

#### Old method

User's network speed is testing by generating dummy 25 MB data using a Next.js
API route. The frontend requests the speed test endpoint, and measures the time
it takes to download the data. It then uploads the same data back to the server
to measure the upload speed.

It is worth noting that the Speedtest.net API was preferred but was not
compatible with the Next.js serverless environment.

### ISP Detection

The user's ISP is detected using the [ipinfo.io](https://ipinfo.io/) API.

```ts
const response = await fetch(
  `https://ipinfo.io/json?token=${process.env.NEXT_PUBLIC_IP_INFO_API_KEY}`
);
if (!response.ok) {
  throw new Error("Failed to fetch ISP info.");
}
const data = await response.json();
return data.org.split(" ").slice(1).join(" ");
```

There's a default list of ISPs in Firestore. If a new ISP is detected, the
database is automatically updated, and this new ISP is added to the dropdown
menu for future submissions.

### Markers

#### Colors

- Green: reported speed close or equal to advertised speed
- Yellow: reported speed is less than advertised speed
- Red: reported speed is significantly less than advertised speed

#### Memoization

The markers are memoized to prevent re-rendering on each state change. The
memoization is done using the `useMemo` hook.

`React.memo()` is a higher-order component that memoizes the rendered output of
the wrapped component. The `MemoizedMarker` components only re-render when their
specific props change.

```tsx
const MemoizedMarker = React.memo(({ point, setMarkerRef, ... }) => (...));
```

`useMemo()` hook memoizes the result of a computation. In this case, the
computation is the creation of the points array. The memoizedPoints array
reference only changes when the actual data changes.

```tsx
const memoizedPoints = useMemo(() => points, [points]);
```

`useCallback()` hook returns a memoized version of the callback function that
only changes if one of the dependencies has changed. It prevents unnecessary
re-creation of these functions on every render of the Markers component.

```tsx
// setMarkerRef
const setMarkerRef = useCallback(
  (marker: Marker | null, key: string) => {
    // ... function body ...
  },
  [markers]
);

// ratioToColor
const ratioToColor = useCallback((advertised: number, download: number) => {
  // ... function body ...
}, []);
```

#### Clustering

The markers are clustered using the `react-google-maps` library. The
`MarkerClusterer` component groups the markers based on the zoom level of the
map.

### Filtering

Dropdown to filter results by ISP.

### Form

Self report form to add visitor's speed test results. The form includes fields
for:

- ISP
- Advertised speed
- Reported speed (download and upload)

## Hero section

[GitHub Globe](https://ui.aceternity.com/components/github-globe) UI Component
from Aceternity UI.

# Challenges

It was surprisingly difficult to maintain state between the dropdown menu and
the map markers. The markers were not updating correctly when the dropdown menu
was changed. With help from ChatGPT, the issue was resolved by using memoization
to prevent unnecessary re-renders.
