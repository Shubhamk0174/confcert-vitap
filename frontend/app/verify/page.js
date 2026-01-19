'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, CheckCircle, XCircle, Loader2, Shield, Info, ExternalLink, FileText, User, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { getCertificate, formatTimestamp, getAddressLink } from '../../lib/web3';
import { getIPFSUrl, getAllIPFSUrls } from '../../lib/ipfs';
import Image from 'next/image';

function VerifyContent() {
  const [certificateId, setCertificateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const searchParams = useSearchParams();

  const handleVerify = useCallback(async (certId = certificateId) => {
    const idToVerify = certId || certificateId;
    
    if (!idToVerify || isNaN(idToVerify)) {
      setError('Please enter a valid certificate ID');
      return;
    }

    setLoading(true);
    setResult(null);
    setError('');
    setCurrentGatewayIndex(0); // Reset to first gateway
    setImageError(false); // Reset image error state

    try {
      // Fetch certificate from blockchain (read-only, no wallet needed)
      const response = await getCertificate(parseInt(idToVerify));
      
      if (response.success) {
        setResult({
          valid: true,
          certificate: response.certificate
        });
        setImageLoading(true); // Start loading image
      } else {
        setResult({
          valid: false,
          error: response.error
        });
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify certificate. Please check your connection.');
      setResult({ valid: false });
    } finally {
      setLoading(false);
    }
  }, [certificateId]);

  // Auto-verify if certificateid is in URL
  useEffect(() => {
    const urlCertificateId = searchParams.get('certificateid');
    if (urlCertificateId && !result && !loading) {
      setCertificateId(urlCertificateId);
      handleVerify(urlCertificateId);
    }
  }, [searchParams, result, loading, handleVerify]);

  // Fallback for image loading timeout
  useEffect(() => {
    if (imageLoading) {
      const timeout = setTimeout(() => {
        setImageLoading(false);
      }, 10000); // 10 seconds timeout

      return () => clearTimeout(timeout);
    }
  }, [imageLoading]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    await handleVerify();
  };

  const handleReset = () => {
    setCertificateId('');
    setResult(null);
    setError('');
    setImageLoading(false);
    setCurrentGatewayIndex(0);
    setImageError(false);
  };

  const handleImageError = () => {
    console.log(`❌ Image failed to load from gateway ${currentGatewayIndex}`);
    
    // Try next gateway
    const maxGateways = 6; // We have 6 gateways
    if (currentGatewayIndex < maxGateways - 1) {
      console.log(`🔄 Trying next gateway (${currentGatewayIndex + 1})`);
      setCurrentGatewayIndex(prev => prev + 1);
      setImageLoading(true);
    } else {
      console.log('❌ All gateways exhausted');
      setImageLoading(false);
      setImageError(true);
    }
  };

  const handleImageLoad = () => {
    console.log(`✅ Image loaded successfully from gateway ${currentGatewayIndex}`);
    setImageLoading(false);
    setImageError(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-10 w-10 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">
                Verify Certificate
              </h1>
            </div>
            <p className="text-muted-foreground">
              Instantly verify the authenticity of blockchain-issued certificates
            </p>
          </div>

          {/* Verification Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Enter Certificate ID</CardTitle>
              <CardDescription>
                Enter the unique certificate ID to verify its authenticity on the Sepolia blockchain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={certificateId}
                      onChange={(e) => setCertificateId(e.target.value)}
                      required
                      placeholder="Enter certificate ID (e.g., 1001)"
                      className="font-mono text-lg"
                      disabled={loading}
                    />
                    {searchParams.get('certificateid') && !result && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Auto-verifying certificate from URL...
                      </p>
                    )}
                  </div>
                  <Button type="submit" disabled={loading} size="lg">
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Verify
                      </>
                    )}
                  </Button>
                </div>
                {result && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleReset}
                    className="w-full"
                  >
                    Search Another Certificate
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Result */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              {result.valid && result.certificate ? (
                <div className="space-y-4">
                  {/* Success Header */}
                  <Alert className="border-primary/50 bg-primary/5">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <AlertTitle className="text-primary text-lg">✅ Certificate Verified Successfully!</AlertTitle>
                    <AlertDescription className="text-primary/80">
                      This certificate is authentic and registered on the Sepolia blockchain.
                    </AlertDescription>
                  </Alert>

                  {/* Certificate Details Card */}
                  <Card className="border-2 ">
                    <CardHeader className="">
                      <div className="flex items-center justify-between pt-2">
                        <CardTitle className="text-2xl">Certificate #{result.certificate.id}</CardTitle>
                        <Badge className="bg-green-600">Verified</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      {/* Student Information */}
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-secondary rounded-lg">
                          <User className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Student Name</p>
                            <p className="text-lg font-semibold">{result.certificate.studentName}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-secondary rounded-lg">
                          <FileText className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Registration Number</p>
                            <p className="text-lg font-semibold">{result.certificate.regNo}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-secondary rounded-lg">
                          <Calendar className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Issue Date</p>
                            <p className="text-lg font-semibold">
                              {formatTimestamp(result.certificate.timestamp)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-secondary rounded-lg">
                          <Shield className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Issued By</p>
                            <p className="text-lg font-semibold">{result.certificate.issuerUsername}</p>
                            <p className="text-sm font-mono break-all mt-1">
                              {result.certificate.issuerAddress}
                            </p>
                            <a 
                              href={getAddressLink(result.certificate.issuerAddress)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                            >
                              View on Etherscan <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-secondary rounded-lg">
                          <FileText className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">IPFS Hash (CID)</p>
                            <p className="text-sm font-mono break-all mt-1">
                              {result.certificate.ipfsHash}
                            </p>
                            <a 
                              href={getIPFSUrl(result.certificate.ipfsHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-2"
                            >
                              View Certificate on IPFS <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Certificate Preview */}
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-3">Certificate Preview</h3>
                        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center min-h-149 relative overflow-hidden">
                          {imageLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <p className="text-sm">Loading certificate...</p>
                              </div>
                            </div>
                          )}
                          
                          {!imageError ? (
                            <Image
                              key={currentGatewayIndex}
                              fill
                              src={getIPFSUrl(result.certificate.ipfsHash, currentGatewayIndex)}
                              alt="Certificate"
                              className="object-contain rounded-lg shadow-sm"
                              unoptimized
                              onError={handleImageError}
                              onLoad={handleImageLoad}
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                              <FileText className="h-12 w-12" />
                              <div className="text-center">
                                <p className="text-sm font-medium">Certificate preview unavailable</p>
                                <p className="text-xs">All IPFS gateways are currently rate-limited</p>
                                <p className="text-xs text-primary mt-2">Try one of these alternative gateways:</p>
                              </div>
                              <div className="flex flex-wrap gap-2 justify-center mt-2">
                                {getAllIPFSUrls(result.certificate.ipfsHash).slice(0, 3).map((url, idx) => (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Gateway {idx + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-5 w-5" />
                  <AlertTitle className="text-lg">Certificate Not Found</AlertTitle>
                  <AlertDescription>
                    {result.error || 'This certificate ID could not be verified. Please check the ID and try again.'}
                  </AlertDescription>
                </Alert>
              )}
            </motion.div>
          )}

          {/* Info Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold">How Verification Works</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Certificate data is stored immutably on the Sepolia blockchain</li>
                    <li>Each certificate has a unique ID starting from 1001</li>
                    <li>Certificate files are stored on IPFS (decentralized storage)</li>
                    <li>Verification is instant and tamper-proof</li>
                    <li>Anyone can verify a certificate&apos;s authenticity</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default function Verify() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-100">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Loading verification page...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
