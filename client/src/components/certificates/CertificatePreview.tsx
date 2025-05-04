import React, { forwardRef, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Certificate } from "@shared/schema";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useReactToPrint } from "react-to-print";
import { Download, Printer } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface CertificatePreviewProps {
  certificate: {
    id: number;
    certificateNumber: string;
    qrCode: string;
    issuedDate: string;
    event: {
      title: string;
      startDate: string;
      endDate: string;
    };
    user: {
      fullName: string;
      organization?: string;
      position?: string;
    };
  };
  onDownload?: () => void;
}

const CertificatePreview = forwardRef<HTMLDivElement, CertificatePreviewProps>(
  ({ certificate, onDownload }, ref) => {
    const { t } = useTranslation();
    const { language, isRtl } = useLanguage();
    const certificateRef = useRef<HTMLDivElement>(null);
    const actualRef = ref || certificateRef;
    
    // Handle print
    const handlePrint = useReactToPrint({
      content: () => (actualRef as React.RefObject<HTMLDivElement>).current,
      documentTitle: `Certificate-${certificate.certificateNumber}`,
      pageStyle: `
        @page {
          size: 297mm 210mm landscape;
          margin: 0;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
        }
      `,
    });
    
    return (
      <div className="flex flex-col gap-4">
        {/* Print/Download actions */}
        <div className="flex justify-end gap-2 mb-2 no-print">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            {t("certificates.print")}
          </Button>
          {onDownload && (
            <Button onClick={onDownload}>
              <Download className="mr-2 h-4 w-4" />
              {t("certificates.download")}
            </Button>
          )}
        </div>
        
        {/* Certificate container */}
        <div 
          ref={actualRef}
          className="certificate-print bg-white border border-gray-200 rounded-lg p-8 shadow-md w-full max-w-4xl mx-auto"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <div className="relative p-6 h-full">
            {/* Border design */}
            <div className="absolute inset-0 border-[12px] border-double border-primary-200"></div>
            
            {/* Inner content with padding */}
            <div className="relative z-10 flex flex-col items-center justify-between h-full p-4">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="bg-primary-600 text-white rounded-md py-2 px-8 inline-block mb-2">
                  <h1 className="text-2xl font-bold">MedEvents</h1>
                </div>
                <h2 className="text-3xl font-bold text-gray-800">
                  {t("certificates.certificateOfParticipation")}
                </h2>
              </div>
              
              {/* Body */}
              <div className="text-center flex-grow flex flex-col justify-center mb-6">
                <p className="text-lg text-gray-600 mb-6">
                  {t("certificates.thisIsToCertifyThat")}
                </p>
                <h3 className="text-3xl font-bold text-primary-700 mb-4">
                  {certificate.user.fullName}
                </h3>
                {certificate.user.position && (
                  <p className="text-lg text-gray-700 mb-2">
                    {certificate.user.position}
                  </p>
                )}
                {certificate.user.organization && (
                  <p className="text-lg text-gray-700 mb-6">
                    {certificate.user.organization}
                  </p>
                )}
                <p className="text-lg text-gray-600 mb-2">
                  {t("certificates.hasParticipatedIn")}
                </p>
                <h4 className="text-2xl font-bold text-gray-800 mb-6">
                  {certificate.event.title}
                </h4>
                <p className="text-lg text-gray-600">
                  {format(new Date(certificate.event.startDate), "MMMM d, yyyy")}
                  {certificate.event.endDate && new Date(certificate.event.startDate).toDateString() !== new Date(certificate.event.endDate).toDateString() && (
                    <> - {format(new Date(certificate.event.endDate), "MMMM d, yyyy")}</>
                  )}
                </p>
              </div>
              
              {/* Footer */}
              <div className="flex w-full justify-between items-end">
                <div className="text-left">
                  <div className="mb-10">
                    <img 
                      src={certificate.qrCode} 
                      alt="QR Code" 
                      className="w-24 h-24"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t("certificates.scanToVerify")}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {t("certificates.certificateNumber")}: {certificate.certificateNumber}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("certificates.issueDate")}: {format(new Date(certificate.issuedDate), "MMMM d, yyyy")}
                  </p>
                </div>
                <div className="text-center">
                  <div className="mb-2 border-b-2 border-gray-400 w-40"></div>
                  <p className="text-sm font-medium text-gray-700">
                    {t("certificates.authorizedSignature")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CertificatePreview.displayName = "CertificatePreview";

export default CertificatePreview;
