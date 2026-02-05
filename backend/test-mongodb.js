import mongoose from 'mongoose';

console.log('🔍 Testing MongoDB Connection...\n');

const testConnection = async () => {
  try {
    // Try to connect
    await mongoose.connect('mongodb://localhost:27017/streamfy');
    
    console.log('✅ SUCCESS! MongoDB is connected!');
    console.log('📊 Database Name:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('🔌 Port:', mongoose.connection.port);
    console.log('\n🎉 Everything is working perfectly!');
    console.log('\nYou can now:');
    console.log('1. Start your backend server: node server.js');
    console.log('2. Your app will automatically save data to MongoDB');
    console.log('3. Access admin panel to see all data\n');
    
    // Close connection
    await mongoose.connection.close();
    console.log('✅ Test completed successfully!\n');
    process.exit(0);
    
  } catch (error) {
    console.log('❌ ERROR: Could not connect to MongoDB\n');
    console.log('Problem:', error.message);
    console.log('\n🔧 How to fix:');
    console.log('1. Make sure MongoDB is installed');
    console.log('2. Start MongoDB service:');
    console.log('   - Press Windows + R');
    console.log('   - Type: services.msc');
    console.log('   - Find "MongoDB Server"');
    console.log('   - Right-click → Start');
    console.log('\n3. Or run in Command Prompt as Admin:');
    console.log('   net start MongoDB\n');
    
    process.exit(1);
  }
};

testConnection();
