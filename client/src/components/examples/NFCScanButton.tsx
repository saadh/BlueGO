import NFCScanButton from '../NFCScanButton';

export default function NFCScanButtonExample() {
  return (
    <div className="flex items-center justify-center p-8">
      <NFCScanButton 
        onScan={(nfcId) => console.log('Scanned NFC:', nfcId)}
      />
    </div>
  );
}
