import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import path from 'path';
import fs from 'fs';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filePathParam = searchParams.get('path');

    if (!filePathParam) {
      return new NextResponse('File path is required', { status: 400 });
    }

    // Protect against directory traversal
    const safePath = path.normalize(filePathParam).replace(/^(\.\.(\/|\\|$))+/, '');
    
    // In Docker, process.cwd() is /app
    const absolutePath = path.join(process.cwd(), 'storage', 'uploads', safePath);

    if (!fs.existsSync(absolutePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(absolutePath);
    
    // Determine content type based on extension
    const ext = path.extname(absolutePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.doc' || ext === '.docx') contentType = 'application/msword';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
    });

  } catch (error) {
    console.error('API /api/file Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
