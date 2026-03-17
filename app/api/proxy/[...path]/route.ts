import {NextRequest, NextResponse} from "next/server";

const BACKEND = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.radarpuls.com";

type Params = Promise<{path: string[]}>;

function buildProxyHeaders(request: NextRequest): HeadersInit {
  const headers: HeadersInit = {"Content-Type": "application/json"};
  const auth = request.headers.get("Authorization");
  if (auth) {
    headers["Authorization"] = auth;
  }
  return headers;
}

export async function GET(request: NextRequest, {params}: {params: Params}) {
  const {path} = await params;
  const {search} = new URL(request.url);
  const backendUrl = `${BACKEND}/api/${path.join("/")}${search}`;

  const res = await fetch(backendUrl, {
    headers: buildProxyHeaders(request),
    signal: request.signal,
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {"Content-Type": res.headers.get("Content-Type") ?? "application/json"},
  });
}

export async function POST(request: NextRequest, {params}: {params: Params}) {
  const {path} = await params;
  const backendUrl = `${BACKEND}/api/${path.join("/")}`;

  const body = await request.text();
  const res = await fetch(backendUrl, {
    method: "POST",
    headers: buildProxyHeaders(request),
    body,
    signal: request.signal,
  });

  const resBody = await res.text();
  return new NextResponse(resBody, {
    status: res.status,
    headers: {"Content-Type": res.headers.get("Content-Type") ?? "application/json"},
  });
}

export async function PATCH(request: NextRequest, {params}: {params: Params}) {
  const {path} = await params;
  const backendUrl = `${BACKEND}/api/${path.join("/")}`;

  const body = await request.text();
  const res = await fetch(backendUrl, {
    method: "PATCH",
    headers: buildProxyHeaders(request),
    body,
    signal: request.signal,
  });

  const resBody = await res.text();
  return new NextResponse(resBody, {
    status: res.status,
    headers: {"Content-Type": res.headers.get("Content-Type") ?? "application/json"},
  });
}

export async function DELETE(request: NextRequest, {params}: {params: Params}) {
  const {path} = await params;
  const backendUrl = `${BACKEND}/api/${path.join("/")}`;

  const res = await fetch(backendUrl, {
    method: "DELETE",
    headers: buildProxyHeaders(request),
    signal: request.signal,
  });

  const resBody = await res.text();
  return new NextResponse(resBody, {
    status: res.status,
    headers: {"Content-Type": res.headers.get("Content-Type") ?? "application/json"},
  });
}
