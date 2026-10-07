export type OfferField = { key: string; en: string; de: string; preview: boolean };
export type OfferGroup = { id: string; en: string; de: string; fields: OfferField[] };
export const offerGroups: OfferGroup[] = [
  {
    "id": "customer",
    "en": "Offer & Customer",
    "de": "Angebot & Kunde",
    "fields": [
      {
        "key": "file_name_on_lexware",
        "en": "Lexware file",
        "de": "Lexware-Datei",
        "preview": false
      },
      {
        "key": "offer_date",
        "en": "Offer date",
        "de": "Angebotsdatum",
        "preview": true
      },
      {
        "key": "last_modified",
        "en": "Last modified",
        "de": "Zuletzt geändert",
        "preview": true
      },
      {
        "key": "offer_no",
        "en": "Offer no.",
        "de": "Angebotsnummer",
        "preview": true
      },
      {
        "key": "sales_agent",
        "en": "Sales agent",
        "de": "Mitarbeiter",
        "preview": true
      },
      {
        "key": "customer_id",
        "en": "Customer ID",
        "de": "Kundennummer",
        "preview": false
      },
      {
        "key": "customer_name",
        "en": "Customer name",
        "de": "Kundenname",
        "preview": true
      },
      {
        "key": "customer_phone",
        "en": "Phone",
        "de": "Telefon",
        "preview": false
      },
      {
        "key": "customer_email",
        "en": "Email",
        "de": "E-Mail",
        "preview": false
      }
    ]
  },
  {
    "id": "medium",
    "en": "Medium info",
    "de": "Medium",
    "fields": [
      {
        "key": "medium",
        "en": "Medium",
        "de": "Medium",
        "preview": true
      },
      {
        "key": "temperature",
        "en": "Temperature",
        "de": "Temperatur",
        "preview": true
      },
      {
        "key": "density",
        "en": "Density",
        "de": "Dichte",
        "preview": true
      },
      {
        "key": "viscosity",
        "en": "Viscosity",
        "de": "Viskosität",
        "preview": true
      },
      {
        "key": "solids_in_the_liquid_by_customer",
        "en": "Solids (customer)",
        "de": "Feststoffe (Kunde)",
        "preview": true
      }
    ]
  },
  {
    "id": "pump",
    "en": "Pump details",
    "de": "Pumpendaten",
    "fields": [
      {
        "key": "pump_type",
        "en": "Pump type",
        "de": "Pumpentyp",
        "preview": true
      },
      {
        "key": "pump_quantity",
        "en": "Quantity",
        "de": "Anzahl",
        "preview": false
      },
      {
        "key": "maximum_solids_pump_calculated",
        "en": "Max. solids (calculated)",
        "de": "Max. Feststoffe (berechnet)",
        "preview": false
      },
      {
        "key": "operation",
        "en": "Operation",
        "de": "Betriebsweise",
        "preview": false
      },
      {
        "key": "pump_direction_of_rotation",
        "en": "Direction of rotation",
        "de": "Drehrichtung",
        "preview": false
      },
      {
        "key": "installation",
        "en": "Installation",
        "de": "Einbaulage",
        "preview": true
      },
      {
        "key": "flow_rate",
        "en": "Flow rate",
        "de": "Fördermenge",
        "preview": true
      },
      {
        "key": "suction_head",
        "en": "Suction head",
        "de": "Zulauf",
        "preview": true
      },
      {
        "key": "delivery_pressure",
        "en": "Delivery pressure",
        "de": "Förderdruck",
        "preview": true
      }
    ]
  },
  {
    "id": "materials",
    "en": "Pump materials",
    "de": "Pumpenwerkstoffe",
    "fields": [
      {
        "key": "pump_casing",
        "en": "Pump casing",
        "de": "Pumpengehäuse",
        "preview": true
      },
      {
        "key": "lantern",
        "en": "Lantern",
        "de": "Laterne",
        "preview": false
      },
      {
        "key": "pump_casing_sealing",
        "en": "Casing sealing",
        "de": "Gehäusedichtung",
        "preview": false
      },
      {
        "key": "pump_rotating_parts",
        "en": "Rotating parts",
        "de": "Rotierende Teile",
        "preview": false
      },
      {
        "key": "pump_joints",
        "en": "Joints",
        "de": "Gelenke",
        "preview": false
      },
      {
        "key": "pump_rotor",
        "en": "Rotor",
        "de": "Rotor",
        "preview": true
      },
      {
        "key": "pump_stator",
        "en": "Stator",
        "de": "Stator",
        "preview": true
      },
      {
        "key": "pump_shaft_sealing",
        "en": "Shaft sealing",
        "de": "Wellendichtung",
        "preview": true
      },
      {
        "key": "painting",
        "en": "Painting",
        "de": "Lackierung",
        "preview": false
      },
      {
        "key": "baseplate",
        "en": "Baseplate",
        "de": "Grundplatte",
        "preview": false
      }
    ]
  },
  {
    "id": "measurements",
    "en": "Measurements",
    "de": "Abmessungen",
    "fields": [
      {
        "key": "immersion_depth",
        "en": "Immersion depth",
        "de": "Eintauchtiefe",
        "preview": true
      },
      {
        "key": "immersion_tube",
        "en": "Immersion tube",
        "de": "Tauchrohr",
        "preview": true
      },
      {
        "key": "delivery_port",
        "en": "Delivery port",
        "de": "Druckanschluss",
        "preview": true
      },
      {
        "key": "pump_weight",
        "en": "Pump weight",
        "de": "Pumpengewicht",
        "preview": true
      },
      {
        "key": "cip_port",
        "en": "CIP port",
        "de": "CIP-Anschluss",
        "preview": false
      }
    ]
  },
  {
    "id": "motor",
    "en": "Motor details",
    "de": "Motordaten",
    "fields": [
      {
        "key": "motor_speed",
        "en": "Motor speed",
        "de": "Drehzahl",
        "preview": true
      },
      {
        "key": "speed_range",
        "en": "Speed range",
        "de": "Drehzahlbereich",
        "preview": false
      },
      {
        "key": "drive_power",
        "en": "Drive power",
        "de": "Antriebsleistung",
        "preview": true
      },
      {
        "key": "motor",
        "en": "Motor",
        "de": "Motor",
        "preview": true
      },
      {
        "key": "protection_isolation",
        "en": "Protection / isolation",
        "de": "Schutzart / Isolation",
        "preview": false
      },
      {
        "key": "mounting_flange_shaft",
        "en": "Mounting / flange / shaft",
        "de": "Bauform / Flansch / Welle",
        "preview": false
      },
      {
        "key": "motor_weight",
        "en": "Motor weight",
        "de": "Motorgewicht",
        "preview": false
      },
      {
        "key": "voltage_frequency",
        "en": "Voltage / frequency",
        "de": "Spannung / Frequenz",
        "preview": true
      }
    ]
  }
];
export const offerFields = offerGroups.flatMap(group => group.fields);
