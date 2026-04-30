// import ReceiptList from "@/components/ReceiptList";
import PDFDropzone from "@/components/PDFDropzone"
import ReceiptList from "@/components/ReceiptList"

function Receipts() {
  return (
    <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="section-label">Workspace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Receipts</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Upload a PDF receipt and review the extracted data in a single, uncluttered view.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <PDFDropzone />

            <ReceiptList />
        </div>
    </div>
  )
}

export default Receipts