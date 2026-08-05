import QRCode from "qrcode";
import { currentUser } from "../../../../../lib/auth";
import { query } from "../../../../../lib/db";
import { visibilitySql } from "../../../../../lib/visibility";

export async function GET(request:Request,context:{params:Promise<{id:string}>}){
  const user=await currentUser();if(!user)return new Response("Unauthorized",{status:401});
  const {id}=await context.params;const scope=visibilitySql(user,"ar",2);
  const result=await query<{verification_token:string}>(`SELECT verification_token FROM uars.access_requests ar WHERE id=$1 AND ${scope.sql}`,[id,...scope.values]);
  if(!result.rows[0])return new Response("Not found",{status:404});
  const url=new URL(`/api/verify/${result.rows[0].verification_token}`,request.url).toString();
  const svg=await QRCode.toString(url,{type:"svg",margin:1,width:180,errorCorrectionLevel:"M"});
  return new Response(svg,{headers:{"content-type":"image/svg+xml","cache-control":"private, no-store"}});
}
