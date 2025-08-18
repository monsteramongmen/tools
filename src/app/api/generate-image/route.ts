import { NextRequest, NextResponse } from "next/server";

const API_KEY = "infip-8b89f71e";
const BASE_URL = "https://api.infip.pro";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, prompt, n = 1, size = "1024x1024" } = body;

    const response = await fetch(`${BASE_URL}/v1/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, prompt, n, size }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `API Error: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Image generation failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
