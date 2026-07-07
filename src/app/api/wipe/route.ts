import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { DeviceStat, Summary, AppStat, ProtocolStat, Flow, Threat } from '../../../../backend/models/Schemas';

export async function GET() {
  try {
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      return NextResponse.json({ error: 'MongoDB not connected on frontend route' }, { status: 500 });
    }
    
    await DeviceStat.deleteMany({});
    await Summary.deleteMany({});
    await AppStat.deleteMany({});
    await ProtocolStat.deleteMany({});
    await Flow.deleteMany({});
    await Threat.deleteMany({});
    
    return NextResponse.json({ message: 'All dummy data wiped from in-memory database successfully!' });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
