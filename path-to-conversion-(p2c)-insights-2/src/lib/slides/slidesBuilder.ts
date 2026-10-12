import { PresentationReport, SlideItem } from '../../types';

// Color Palette matching P2C Analytics Dashboard
const COLORS = {
  teal: { red: 0.031, green: 0.498, blue: 0.451 }, // #087F73
  darkSlate: { red: 0.094, green: 0.125, blue: 0.118 }, // #18201E
  mutedSlate: { red: 0.337, green: 0.38, blue: 0.365 }, // #56615D
  lightGray: { red: 0.49, green: 0.529, blue: 0.51 }, // #7D8782
  bgLight: { red: 0.965, green: 0.969, blue: 0.957 }, // #F6F7F4
  surface: { red: 0.941, green: 0.949, blue: 0.933 }, // #F0F2EE
  white: { red: 1.0, green: 1.0, blue: 1.0 }, // #FFFFFF
  border: { red: 0.863, green: 0.886, blue: 0.871 }, // #DCE2DE
  amber: { red: 0.549, green: 0.325, blue: 0.067 }, // #8C5311
};

interface ShapeConfig {
  id: string;
  slideId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: { red: number; green: number; blue: number };
  border?: { red: number; green: number; blue: number };
  borderWidth?: number;
  text?: string;
  fontSize?: number;
  bold?: boolean;
  textColor?: { red: number; green: number; blue: number };
  align?: 'START' | 'CENTER' | 'END';
}

function buildShapeRequests(cfg: ShapeConfig): any[] {
  const requests: any[] = [
    {
      createShape: {
        objectId: cfg.id,
        shapeType: 'RECTANGLE',
        elementProperties: {
          pageObjectId: cfg.slideId,
          size: {
            width: { magnitude: cfg.w, unit: 'PT' },
            height: { magnitude: cfg.h, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: cfg.x,
            translateY: cfg.y,
            unit: 'PT',
          },
        },
      },
    },
  ];

  // Shape properties (fill & border)
  const shapeProperties: any = {};
  const fields: string[] = [];

  if (cfg.fill) {
    shapeProperties.shapeBackgroundFill = {
      solidFill: {
        color: { rgbColor: cfg.fill },
      },
    };
    fields.push('shapeBackgroundFill');
  } else {
    shapeProperties.shapeBackgroundFill = {
      propertyState: 'NOT_RENDERED',
    };
    fields.push('shapeBackgroundFill');
  }

  if (cfg.border) {
    shapeProperties.outline = {
      outlineFill: {
        solidFill: { color: { rgbColor: cfg.border } },
      },
      weight: { magnitude: cfg.borderWidth || 1, unit: 'PT' },
    };
    fields.push('outline');
  } else {
    shapeProperties.outline = {
      propertyState: 'NOT_RENDERED',
    };
    fields.push('outline');
  }

  if (fields.length > 0) {
    requests.push({
      updateShapeProperties: {
        objectId: cfg.id,
        shapeProperties,
        fields: fields.join(','),
      },
    });
  }

  // Insert text if provided
  if (cfg.text && cfg.text.trim()) {
    requests.push({
      insertText: {
        objectId: cfg.id,
        text: cfg.text,
        insertionIndex: 0,
      },
    });

    const textStyle: any = {
      fontFamily: 'Arial',
      fontSize: { magnitude: cfg.fontSize || 12, unit: 'PT' },
      bold: Boolean(cfg.bold),
    };

    if (cfg.textColor) {
      textStyle.foregroundColor = {
        opaqueColor: { rgbColor: cfg.textColor },
      };
    }

    requests.push({
      updateTextStyle: {
        objectId: cfg.id,
        style: textStyle,
        textRange: { type: 'ALL' },
        fields: 'fontFamily,fontSize,bold,foregroundColor',
      },
    });

    if (cfg.align) {
      requests.push({
        updateParagraphStyle: {
          objectId: cfg.id,
          style: {
            alignment: cfg.align,
          },
          textRange: { type: 'ALL' },
          fields: 'alignment',
        },
      });
    }
  }

  return requests;
}

/**
 * Creates and populates a complete Google Slides presentation via batchUpdate
 */
export async function createGoogleSlidesPresentation(
  token: string,
  report: PresentationReport
): Promise<{ presentationId: string; presentationUrl: string; title: string }> {
  // 1. Create a new presentation
  const title = report.title || 'Path-to-Conversion Insights Report';
  const fullTitle = `${title} - ${report.dateRange || new Date().toLocaleDateString()}`;

  let presentationId = '';
  let initialSlideId = '';

  // Attempt 1: Direct Google Slides API
  try {
    const createResp = await fetch('https://slides.googleapis.com/v1/presentations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: fullTitle,
      }),
    });

    if (createResp.ok) {
      const presData = await createResp.json();
      presentationId = presData.presentationId;
      initialSlideId = presData.slides?.[0]?.objectId;
    } else {
      const errText = await createResp.text();
      let errorDetail = errText;
      try {
        const parsed = JSON.parse(errText);
        errorDetail = parsed.error?.message || errText;
      } catch {
        // Keep raw
      }

      console.warn('Slides API presentation create response:', createResp.status, errorDetail);

      if (
        errorDetail.toLowerCase().includes('storage quota') ||
        errorDetail.toLowerCase().includes('quota has been exceeded')
      ) {
        throw new Error(
          `Google Drive storage quota exceeded: Your Google Drive storage is full. Google cannot create new files in your Drive until space is freed up or trash is emptied at drive.google.com.`
        );
      }
    }
  } catch (err: any) {
    if (err?.message?.includes('Google Drive storage quota exceeded')) {
      throw err;
    }
    console.warn('Network or error calling Slides API create:', err);
  }

  // Attempt 2: Drive API files.create fallback (uses drive.file scope to create presentation file)
  if (!presentationId) {
    try {
      const driveResp = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fullTitle,
          mimeType: 'application/vnd.google-apps.presentation',
        }),
      });

      if (driveResp.ok) {
        const driveData = await driveResp.json();
        presentationId = driveData.id;
      } else {
        const driveErrText = await driveResp.text();
        let errorDetail = driveErrText;
        try {
          const parsed = JSON.parse(driveErrText);
          errorDetail = parsed.error?.message || driveErrText;
        } catch {
          // Keep raw
        }

        if (
          errorDetail.toLowerCase().includes('storage quota') ||
          errorDetail.toLowerCase().includes('quota has been exceeded')
        ) {
          throw new Error(
            `Google Drive storage quota exceeded: Your Google Drive storage is full (0 bytes remaining). Google cannot create new files until you free up space or empty your Trash in Google Drive.`
          );
        }

        if (
          errorDetail.includes('has not been used in project') ||
          errorDetail.includes('disabled') ||
          errorDetail.includes('it is disabled')
        ) {
          const directEnableUrl =
            'https://console.cloud.google.com/apis/library/slides.googleapis.com?project=upbeat-voice-398215';
          throw new Error(
            `Google Slides API is not enabled in your Google Cloud Project (upbeat-voice-398215). Enable it at: ${directEnableUrl}`
          );
        }

        throw new Error(
          `Google Slides creation error (${driveResp.status}): ${errorDetail}`
        );
      }
    } catch (fallbackErr: any) {
      throw fallbackErr;
    }
  }

  // 2. Prepare batchUpdate requests for slides
  const requests: any[] = [];
  const slideCount = report.slides.length;

  report.slides.forEach((slide: SlideItem, sIdx: number) => {
    const slideId = `p2c_slide_${sIdx + 1}`;
    const slideNum = sIdx + 1;

    // Create the blank slide
    requests.push({
      createSlide: {
        objectId: slideId,
        slideLayoutReference: {
          predefinedLayout: 'BLANK',
        },
      },
    });

    // Top Teal Accent Banner line
    requests.push(
      ...buildShapeRequests({
        id: `top_accent_${slideId}`,
        slideId,
        x: 0,
        y: 0,
        w: 720,
        h: 4,
        fill: COLORS.teal,
      })
    );

    // Slide category / kicker tag
    const categoryText =
      slide.type === 'title'
        ? 'P2C INSIGHTS • EXECUTIVE REPORT'
        : `P2C INSIGHTS • ${slide.type.toUpperCase()}`;

    requests.push(
      ...buildShapeRequests({
        id: `kicker_${slideId}`,
        slideId,
        x: 40,
        y: 20,
        w: 640,
        h: 16,
        text: categoryText,
        fontSize: 9,
        bold: true,
        textColor: COLORS.teal,
      })
    );

    // Slide Title
    requests.push(
      ...buildShapeRequests({
        id: `title_${slideId}`,
        slideId,
        x: 40,
        y: 38,
        w: 640,
        h: 36,
        text: slide.title,
        fontSize: slide.type === 'title' ? 24 : 18,
        bold: true,
        textColor: COLORS.darkSlate,
      })
    );

    // Slide Subtitle
    if (slide.subtitle) {
      requests.push(
        ...buildShapeRequests({
          id: `sub_${slideId}`,
          slideId,
          x: 40,
          y: 74,
          w: 640,
          h: 22,
          text: slide.subtitle,
          fontSize: 11,
          textColor: COLORS.mutedSlate,
        })
      );
    }

    // Divider line below header
    requests.push(
      ...buildShapeRequests({
        id: `div_${slideId}`,
        slideId,
        x: 40,
        y: 102,
        w: 640,
        h: 1,
        fill: COLORS.border,
      })
    );

    // Slide Body Layout by Type
    if (slide.type === 'title') {
      // Branded Title Layout
      requests.push(
        ...buildShapeRequests({
          id: `hero_card_${slideId}`,
          slideId,
          x: 40,
          y: 120,
          w: 640,
          h: 160,
          fill: COLORS.surface,
          border: COLORS.border,
          borderWidth: 1,
        }),
        ...buildShapeRequests({
          id: `hero_title_${slideId}`,
          slideId,
          x: 65,
          y: 145,
          w: 590,
          h: 40,
          text: 'Multi-Touch Path-to-Conversion Intelligence',
          fontSize: 16,
          bold: true,
          textColor: COLORS.darkSlate,
        }),
        ...buildShapeRequests({
          id: `hero_desc_${slideId}`,
          slideId,
          x: 65,
          y: 185,
          w: 590,
          h: 70,
          text: `Comprehensive multi-touch attribution analysis evaluating touchpoint velocity, assist dynamics, and conversion paths across ${report.dateRange || 'analyzed date range'}.\n\nMethodology: Grounded deterministic telemetry & Gemini pattern synthesis.`,
          fontSize: 11,
          textColor: COLORS.mutedSlate,
        })
      );

      // Metadata card
      requests.push(
        ...buildShapeRequests({
          id: `meta_box_${slideId}`,
          slideId,
          x: 40,
          y: 295,
          w: 640,
          h: 50,
          fill: COLORS.white,
          border: COLORS.border,
          borderWidth: 1,
          text: `Report Period: ${report.dateRange || 'Active Selection'}   |   Confidential Executive Briefing   |   P2C Analytics Engine`,
          fontSize: 10,
          bold: true,
          textColor: COLORS.lightGray,
          align: 'CENTER',
        })
      );
    } else if (slide.type === 'kpi' && slide.metrics && slide.metrics.length > 0) {
      // 4-column KPI Card Grid
      const cardWidth = 145;
      const cardGap = 20;
      const startX = 40;
      const topY = 135;

      slide.metrics.slice(0, 4).forEach((m, mIdx) => {
        const xPos = startX + mIdx * (cardWidth + cardGap);
        const cardId = `kpi_c_${slideId}_${mIdx}`;

        requests.push(
          ...buildShapeRequests({
            id: cardId,
            slideId,
            x: xPos,
            y: topY,
            w: cardWidth,
            h: 175,
            fill: COLORS.white,
            border: COLORS.border,
            borderWidth: 1,
          }),
          ...buildShapeRequests({
            id: `kpi_lbl_${slideId}_${mIdx}`,
            slideId,
            x: xPos + 12,
            y: topY + 16,
            w: cardWidth - 24,
            h: 22,
            text: m.label.toUpperCase(),
            fontSize: 9,
            bold: true,
            textColor: COLORS.lightGray,
          }),
          ...buildShapeRequests({
            id: `kpi_val_${slideId}_${mIdx}`,
            slideId,
            x: xPos + 12,
            y: topY + 45,
            w: cardWidth - 24,
            h: 45,
            text: m.value,
            fontSize: 20,
            bold: true,
            textColor: COLORS.teal,
          })
        );

        if (m.context) {
          requests.push(
            ...buildShapeRequests({
              id: `kpi_ctx_${slideId}_${mIdx}`,
              slideId,
              x: xPos + 12,
              y: topY + 100,
              w: cardWidth - 24,
              h: 55,
              text: m.context,
              fontSize: 10,
              textColor: COLORS.mutedSlate,
            })
          );
        }
      });
    } else {
      // Standard content slide with structured metric highlight cards + bullet list
      let currentY = 120;

      // If metrics exist, place top summary metrics
      if (slide.metrics && slide.metrics.length > 0) {
        const mCount = Math.min(slide.metrics.length, 3);
        const mW = Math.floor((640 - (mCount - 1) * 15) / mCount);

        slide.metrics.slice(0, 3).forEach((m, mIdx) => {
          const mX = 40 + mIdx * (mW + 15);
          requests.push(
            ...buildShapeRequests({
              id: `m_box_${slideId}_${mIdx}`,
              slideId,
              x: mX,
              y: currentY,
              w: mW,
              h: 58,
              fill: COLORS.surface,
              border: COLORS.border,
              borderWidth: 1,
            }),
            ...buildShapeRequests({
              id: `m_txt_${slideId}_${mIdx}`,
              slideId,
              x: mX + 10,
              y: currentY + 8,
              w: mW - 20,
              h: 42,
              text: `${m.label}: ${m.value}\n${m.context || ''}`,
              fontSize: 10,
              bold: true,
              textColor: COLORS.darkSlate,
            })
          );
        });

        currentY += 72;
      }

      // Bullets container
      if (slide.bullets && slide.bullets.length > 0) {
        const bulletBoxH = Math.min(220, 350 - currentY);
        const bulletText = slide.bullets.map((b) => `•  ${b}`).join('\n\n');

        requests.push(
          ...buildShapeRequests({
            id: `bullets_card_${slideId}`,
            slideId,
            x: 40,
            y: currentY,
            w: 640,
            h: bulletBoxH,
            fill: COLORS.white,
            border: COLORS.border,
            borderWidth: 1,
            text: bulletText,
            fontSize: 11,
            textColor: COLORS.darkSlate,
          })
        );
      }
    }

    // Bottom Footer (Footer line + Brand footnote + Slide numbers)
    requests.push(
      ...buildShapeRequests({
        id: `foot_line_${slideId}`,
        slideId,
        x: 40,
        y: 375,
        w: 640,
        h: 1,
        fill: COLORS.border,
      }),
      ...buildShapeRequests({
        id: `foot_left_${slideId}`,
        slideId,
        x: 40,
        y: 382,
        w: 300,
        h: 18,
        text: 'Generated from P2C Insights',
        fontSize: 9,
        textColor: COLORS.lightGray,
      }),
      ...buildShapeRequests({
        id: `foot_right_${slideId}`,
        slideId,
        x: 520,
        y: 382,
        w: 160,
        h: 18,
        text: `Slide ${slideNum} of ${slideCount}`,
        fontSize: 9,
        textColor: COLORS.lightGray,
        align: 'END',
      })
    );
  });

  // Delete the initial blank template slide if it was auto-created by Google Slides
  if (initialSlideId) {
    requests.push({
      deleteObject: {
        objectId: initialSlideId,
      },
    });
  }

  // Execute the batchUpdate
  const batchResp = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!batchResp.ok) {
    const batchErr = await batchResp.text();
    console.error('Google Slides batchUpdate failed:', batchErr);
    throw new Error(`Google Slides population error (${batchResp.status}): ${batchErr}`);
  }

  return {
    presentationId,
    presentationUrl: `https://docs.google.com/presentation/d/${presentationId}/edit`,
    title,
  };
}
