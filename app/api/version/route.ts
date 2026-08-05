import { NextResponse } from "next/server";

export const dynamic="force-dynamic";
export async function GET(){return NextResponse.json({version:"1.4.1"},{headers:{"cache-control":"no-store, no-cache, must-revalidate","pragma":"no-cache","expires":"0"}});}
