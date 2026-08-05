import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { currentUser } from "../../../../../../lib/auth";
import { query } from "../../../../../../lib/db";
import { policyRequired, visibilitySql } from "../../../../../../lib/visibility";

export async function GET(_request:Request,{params}:{params:Promise<{id:string;attachmentId:string}>}){
  const user=await currentUser();
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  if(policyRequired(user))return NextResponse.json({error:"Accept the LTOCM Policy Agreement first."},{status:403});
  const {id,attachmentId}=await params;
  const scope=visibilitySql(user,"r",3);
  const result=await query<{original_name:string;stored_name:string;content_type:string;size_bytes:string}>(`SELECT a.original_name,a.stored_name,a.content_type,a.size_bytes::text FROM uars.request_attachments a JOIN uars.access_requests r ON r.id=a.request_id WHERE a.id=$1 AND r.id=$2 AND ${scope.sql}`,[attachmentId,id,...scope.values]);
  const attachment=result.rows[0];
  if(!attachment)return NextResponse.json({error:"Attachment not found."},{status:404});
  try{
    const bytes=await readFile(join(process.env.UPLOAD_DIR||"/tmp/lto-uars-uploads",attachment.stored_name));
    return new Response(bytes,{headers:{"content-type":attachment.content_type,"content-length":attachment.size_bytes,"content-disposition":`attachment; filename*=UTF-8''${encodeURIComponent(attachment.original_name)}`,"x-content-type-options":"nosniff","cache-control":"private, no-store"}});
  }catch{return NextResponse.json({error:"Attachment file is unavailable."},{status:404});}
}
