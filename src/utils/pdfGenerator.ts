import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale, AppSettings, UserProfile, Customer } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const generateSalePDF = (
  sale: Sale, 
  settings: AppSettings, 
  seller?: UserProfile | null,
  customer?: Customer | null,
  options?: { share?: boolean; theme?: 'light' | 'dark' }
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const isDark = options?.theme === 'dark';

  // Background for Dark Theme
  if (isDark) {
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
  }

  // Colors based on theme
  const primaryColor = isDark ? [129, 140, 248] : [79, 70, 229]; // Indigo-400 : Indigo-600
  const textColorMain = isDark ? [248, 250, 252] : [15, 23, 42]; // Slate-50 : Slate-900
  const textColorMuted = isDark ? [148, 163, 184] : [100, 116, 139]; // Slate-400 : Slate-500
  const borderColor = isDark ? [30, 41, 59] : [226, 232, 240]; // Slate-800 : Slate-200

  // Header - Company Logo & Info
  let yPos = 20;
  
  if (settings.companyLogo) {
    try {
      doc.addImage(settings.companyLogo, 'PNG', 20, yPos, 25, 25);
      yPos += 30;
    } catch (e) {
      console.error('Error adding logo to PDF:', e);
    }
  }

  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.companyName, 20, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
  
  if (settings.cnpj) {
    doc.text(`CNPJ: ${settings.cnpj}`, 20, yPos);
    yPos += 5;
  }
  if (settings.phone) {
    doc.text(`Tel: ${settings.phone}`, 20, yPos);
    yPos += 5;
  }
  if (settings.email) {
    doc.text(`E-mail: ${settings.email}`, 20, yPos);
    yPos += 5;
  }
  if (settings.address) {
    const addressLines = doc.splitTextToSize(settings.address, 80);
    doc.text(addressLines, 20, yPos);
    yPos += addressLines.length * 5;
  }

  // Social Media
  if (settings.socialMedia) {
    const socials = [];
    if (settings.socialMedia.instagram) socials.push(`Insta: ${settings.socialMedia.instagram}`);
    if (settings.socialMedia.facebook) socials.push(`FB: ${settings.socialMedia.facebook}`);
    if (settings.socialMedia.whatsapp) socials.push(`Whats: ${settings.socialMedia.whatsapp}`);
    
    if (socials.length > 0) {
      doc.setFontSize(8);
      doc.text(socials.join(' | '), 20, yPos);
      yPos += 5;
    }
  }

  // Sale Info (Right side)
  const rightX = pageWidth - 20;
  doc.setFontSize(14);
  doc.setTextColor(textColorMain[0], textColorMain[1], textColorMain[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(sale.status === 'pending' ? 'ORÇAMENTO' : 'COMPROVANTE DE VENDA', rightX, 20, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
  doc.text(`Nº: #${sale.id?.slice(-6).toUpperCase() || 'NOVO'}`, rightX, 28, { align: 'right' });
  doc.text(`Data: ${format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, rightX, 33, { align: 'right' });
  
  if (sale.dueDate) {
    doc.text(`Vencimento: ${format(new Date(sale.dueDate + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}`, rightX, 38, { align: 'right' });
  }
  
  if (sale.paymentStatus) {
    const statusMap = {
      paid: 'PAGO',
      pending: 'PENDENTE',
      overdue: 'ATRASADO'
    };
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Status Pagamento: ${statusMap[sale.paymentStatus]}`, rightX, sale.dueDate ? 43 : 38, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
  }

  // Divider
  const dividerY = Math.max(yPos + 5, 60);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(20, dividerY, pageWidth - 20, dividerY);
  yPos = dividerY + 10;

  // Customer & Seller Info
  doc.setFontSize(11);
  doc.setTextColor(textColorMain[0], textColorMain[1], textColorMain[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO CLIENTE', 20, yPos);
  doc.text('DADOS DO VENDEDOR', pageWidth / 2 + 10, yPos);
  
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
  
  // Client Details
  let clientY = yPos;
  doc.text(sale.customerName || 'Venda Avulsa', 20, clientY);
  if (customer) {
    if (customer.email) {
      clientY += 5;
      doc.text(`E-mail: ${customer.email}`, 20, clientY);
    }
    if (customer.phone) {
      clientY += 5;
      doc.text(`Tel: ${customer.phone}`, 20, clientY);
    }
    if (customer.address) {
      clientY += 5;
      const clientAddrLines = doc.splitTextToSize(`End: ${customer.address}`, (pageWidth / 2) - 25);
      doc.text(clientAddrLines, 20, clientY);
      clientY += (clientAddrLines.length - 1) * 5;
    }
  }

  // Seller Details
  let sellerY = yPos;
  doc.text(seller?.displayName || 'Sistema', pageWidth / 2 + 10, sellerY);
  if (seller?.email) {
    sellerY += 5;
    doc.text(`E-mail: ${seller.email}`, pageWidth / 2 + 10, sellerY);
  }
  if (seller?.phone) {
    sellerY += 5;
    doc.text(`Tel: ${seller.phone}`, pageWidth / 2 + 10, sellerY);
  }

  yPos = Math.max(clientY, sellerY) + 15;

  // Items Table
  autoTable(doc, {
    startY: yPos,
    head: [['Produto', 'Qtd', 'Preço Unit.', 'Total']],
    body: sale.items.map(item => [
      item.productName,
      item.quantity,
      `R$ ${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]),
    headStyles: { 
      fillColor: primaryColor as [number, number, number], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold' 
    },
    bodyStyles: {
      fillColor: isDark ? [30, 41, 59] : [255, 255, 255],
      textColor: textColorMain as [number, number, number],
    },
    alternateRowStyles: { 
      fillColor: isDark ? [15, 23, 42] : [248, 250, 252] 
    },
    margin: { left: 20, right: 20 },
    styles: { fontSize: 9, cellPadding: 4, lineColor: borderColor as [number, number, number], lineWidth: 0.1 }
  });

  // Total & Observations
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  
  if (sale.observations) {
    doc.setFontSize(9);
    doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
    doc.text('Observações:', 20, finalY);
    finalY += 5;
    const obsLines = doc.splitTextToSize(sale.observations, pageWidth - 40);
    doc.text(obsLines, 20, finalY);
    finalY += (obsLines.length * 5) + 5;
  }

  doc.setFontSize(14);
  doc.setTextColor(textColorMain[0], textColorMain[1], textColorMain[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL: R$ ${sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 20, finalY, { align: 'right' });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
  doc.setFont('helvetica', 'normal');
  const footerText = `Gerado por Integra Pro em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
  doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  // Save or Share PDF
  const fileName = `${sale.status === 'pending' ? 'orcamento' : 'venda'}-${sale.id?.slice(-6) || 'novo'}.pdf`;
  
  if (options?.share && navigator.share) {
    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
    
    navigator.share({
      files: [file],
      title: sale.status === 'pending' ? 'Orçamento' : 'Comprovante de Venda',
      text: `Segue o ${sale.status === 'pending' ? 'orçamento' : 'comprovante'} da ${settings.companyName}`
    }).catch(err => {
      console.error('Error sharing:', err);
      doc.save(fileName);
    });
  } else {
    doc.save(fileName);
  }
};

export const generateSalesReportPDF = (
  sales: Sale[], 
  settings: AppSettings, 
  title: string = 'Relatório de Vendas',
  options?: { share?: boolean; theme?: 'light' | 'dark' }
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const isDark = options?.theme === 'dark';

  // Background for Dark Theme
  if (isDark) {
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
  }

  // Colors based on theme
  const primaryColor = isDark ? [129, 140, 248] : [79, 70, 229];
  const textColorMain = isDark ? [248, 250, 252] : [15, 23, 42];
  const textColorMuted = isDark ? [148, 163, 184] : [100, 116, 139];
  const borderColor = isDark ? [30, 41, 59] : [226, 232, 240];

  // Header
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(settings.companyName, 20, 20);
  
  doc.setFontSize(14);
  doc.setTextColor(textColorMain[0], textColorMain[1], textColorMain[2]);
  doc.text(title.toUpperCase(), pageWidth - 20, 20, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - 20, 28, { align: 'right' });

  // Table
  autoTable(doc, {
    startY: 40,
    head: [['ID', 'Data', 'Cliente', 'Total', 'Status']],
    body: sales.map(sale => [
      `#${sale.id?.slice(-6).toUpperCase() || 'N/A'}`,
      format(new Date(sale.createdAt), 'dd/MM/yyyy'),
      sale.customerName || 'Venda Avulsa',
      `R$ ${sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      sale.status === 'completed' ? 'Concluída' : sale.status === 'pending' ? 'Pendente' : 'Cancelada'
    ]),
    headStyles: { 
      fillColor: primaryColor as [number, number, number], 
      textColor: [255, 255, 255] 
    },
    bodyStyles: {
      fillColor: isDark ? [30, 41, 59] : [255, 255, 255],
      textColor: textColorMain as [number, number, number],
    },
    alternateRowStyles: { 
      fillColor: isDark ? [15, 23, 42] : [248, 250, 252] 
    },
    margin: { left: 20, right: 20 },
    styles: { fontSize: 9, cellPadding: 4, lineColor: borderColor as [number, number, number], lineWidth: 0.1 }
  });

  const totalAmount = sales.reduce((acc, sale) => acc + sale.total, 0);
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setTextColor(textColorMain[0], textColorMain[1], textColorMain[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL GERAL: R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 20, finalY, { align: 'right' });

  const fileName = `relatorio-vendas-${format(new Date(), 'yyyy-MM-dd')}.pdf`;

  if (options?.share && navigator.share) {
    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
    
    navigator.share({
      files: [file],
      title: title,
      text: `Segue o ${title} da ${settings.companyName}`
    }).catch(err => {
      console.error('Error sharing:', err);
      doc.save(fileName);
    });
  } else {
    doc.save(fileName);
  }
};
